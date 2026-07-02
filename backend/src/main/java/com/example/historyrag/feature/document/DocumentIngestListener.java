package com.example.historyrag.feature.document;

import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import com.example.historyrag.infrastructure.webclient.dto.RagClassifyRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagClassifyResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestMetadata;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class DocumentIngestListener {

    private static final Logger log = LoggerFactory.getLogger(DocumentIngestListener.class);

    private final DocumentRepository documentRepository;
    private final RagClientService ragClientService;
    private final boolean reviewEnabled;

    public DocumentIngestListener(DocumentRepository documentRepository,
                                   RagClientService ragClientService,
                                   @Value("${app.document.review.enabled:true}") boolean reviewEnabled) {
        this.documentRepository = documentRepository;
        this.ragClientService = ragClientService;
        this.reviewEnabled = reviewEnabled;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleDocumentIngest(DocumentIngestRequested event) {
        Long docId = event.documentId();

        Document doc = documentRepository.findById(docId).orElse(null);
        if (doc == null) {
            log.warn("Document not found for ingestion: {}", docId);
            return;
        }

        try {
            // Bước 1: AI duyệt nội dung (có thể tắt qua app.document.review.enabled=false)
            RagClassifyResponse verdict = null;
            if (reviewEnabled) {
                doc.setStatus(DocumentStatus.REVIEWING);
                documentRepository.save(doc);
                log.info("Document {} status set to REVIEWING", docId);

                RagClassifyRequest classifyRequest = new RagClassifyRequest(
                        docId, doc.getTitle(), null, doc.getFileUrl(), null);
                verdict = ragClientService.classify(classifyRequest, null);

                double confidence = verdict != null ? verdict.confidence() : 0.5;
                boolean isHistory = verdict == null || Boolean.TRUE.equals(verdict.isHistory());

                doc.setAiConfidence(confidence);
                doc.setReviewReason(verdict != null ? verdict.reason() : null);

                // Quyết định dựa trên confidence threshold
                if (isHistory && confidence >= 0.9) {
                    // === AUTO APPROVE: confidence >= 90% và là lịch sử ===
                    doc.setAiWarningLevel("NONE");
                    doc.setAiReviewStatus("AUTO_APPROVED");
                    log.info("Document {} auto-approved: confidence={}", docId, confidence);
                } else if (!isHistory) {
                    // === KHÔNG PHẢI LỊCH SỬ: red warning, cần admin duyệt ===
                    doc.setStatus(DocumentStatus.PENDING_REVIEW);
                    doc.setAiWarningLevel("DANGER");
                    doc.setAiReviewStatus("PENDING_ADMIN");
                    documentRepository.save(doc);
                    log.warn("Document {} PENDING_REVIEW (not history): confidence={}, reason={}",
                            docId, confidence, verdict != null ? verdict.reason() : "");
                    return;
                } else {
                    // === CONFIDENCE < 90%: cần admin duyệt ===
                    doc.setAiWarningLevel(confidence >= 0.8 ? "WARNING" : "DANGER");
                    doc.setAiReviewStatus("PENDING_ADMIN");
                    doc.setStatus(DocumentStatus.PENDING_REVIEW);
                    documentRepository.save(doc);
                    log.warn("Document {} PENDING_REVIEW (confidence={}): warning={}",
                            docId, confidence, doc.getAiWarningLevel());
                    return;
                }
                documentRepository.save(doc);
            }

            // Bước 2: Index vào Qdrant (chỉ chạy khi auto-approved hoặc review disabled)
            doc.setStatus(DocumentStatus.INDEXING);
            documentRepository.save(doc);
            log.info("Document {} status set to INDEXING", docId);

            RagIngestMetadata metadata = new RagIngestMetadata(
                    null, null, null, java.util.List.of(),
                    java.util.List.of(), java.util.List.of(),
                    doc.getFolderId(), doc.getOwnerId()
            );

            RagIngestRequest ingestRequest = new RagIngestRequest(
                    docId,
                    "DOCUMENT",
                    doc.getTitle(),
                    null,
                    docId,
                    null,
                    doc.getFileUrl(),
                    null,
                    metadata,
                    null
            );

            RagIngestResponse response = ragClientService.ingest(ingestRequest, null);

            if ("COMPLETED".equals(response.status())) {
                doc.setStatus(DocumentStatus.READY);
                doc.setChunkCount(response.chunks() != null ? response.chunks().size() : 0);
                documentRepository.save(doc);
                log.info("Document {} ingestion COMPLETED, chunks={}", docId, doc.getChunkCount());
            } else {
                doc.setStatus(DocumentStatus.FAILED);
                documentRepository.save(doc);
                log.warn("Document {} ingestion FAILED with status: {}", docId, response.status());
            }
        } catch (Exception e) {
            log.error("Document {} ingestion error: {}", docId, e.getMessage(), e);
            doc.setStatus(DocumentStatus.FAILED);
            documentRepository.save(doc);
        }
    }
}
