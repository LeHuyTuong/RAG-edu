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

import java.nio.file.Paths;

@Component
public class DocumentIngestListener {

    private static final Logger log = LoggerFactory.getLogger(DocumentIngestListener.class);

    private final DocumentRepository documentRepository;
    private final RagClientService ragClientService;
    private final String uploadBasePath;
    private final boolean reviewEnabled;

    public DocumentIngestListener(DocumentRepository documentRepository,
                                   RagClientService ragClientService,
                                   @Value("${app.upload.base-path:./uploads}") String uploadBasePath,
                                   @Value("${app.document.review.enabled:true}") boolean reviewEnabled) {
        this.documentRepository = documentRepository;
        this.ragClientService = ragClientService;
        this.uploadBasePath = Paths.get(uploadBasePath).toAbsolutePath().normalize().toString();
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
            String filePath = uploadBasePath + "/" + doc.getPublicId();

            // Bước 1: AI duyệt nội dung (có thể tắt qua app.document.review.enabled=false)
            if (reviewEnabled) {
                doc.setStatus(DocumentStatus.REVIEWING);
                documentRepository.save(doc);
                log.info("Document {} status set to REVIEWING", docId);

                RagClassifyRequest classifyRequest = new RagClassifyRequest(
                        docId, doc.getTitle(), filePath, null, null);
                RagClassifyResponse verdict = ragClientService.classify(classifyRequest, null);

                if (verdict != null && !Boolean.TRUE.equals(verdict.isHistory())) {
                    doc.setStatus(DocumentStatus.REJECTED);
                    doc.setReviewReason(verdict.reason());
                    documentRepository.save(doc);
                    log.warn("Document {} REJECTED by AI review: label={}, reason={}",
                            docId, verdict.label(), verdict.reason());
                    return;
                }
                log.info("Document {} passed AI review: label={}, confidence={}",
                        docId, verdict != null ? verdict.label() : "UNKNOWN",
                        verdict != null ? verdict.confidence() : 0.0);
            }

            // Bước 2: Index vào Qdrant
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
                    filePath,
                    null,
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
