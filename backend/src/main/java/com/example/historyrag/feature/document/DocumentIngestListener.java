package com.example.historyrag.feature.document;

import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.document.chunk.DocumentChunk;
import com.example.historyrag.feature.document.chunk.DocumentChunkService;
import com.example.historyrag.infrastructure.file.FileStorageService;
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
    private final FileStorageService fileStorageService;
    private final DocumentChunkService documentChunkService;
    private final boolean reviewEnabled;
    private final ContentHashLockRegistry contentHashLockRegistry;

    public DocumentIngestListener(DocumentRepository documentRepository,
                                   RagClientService ragClientService,
                                   FileStorageService fileStorageService,
                                   DocumentChunkService documentChunkService,
                                   @Value("${app.document.review.enabled:true}") boolean reviewEnabled,
                                   ContentHashLockRegistry contentHashLockRegistry) {
        this.documentRepository = documentRepository;
        this.ragClientService = ragClientService;
        this.fileStorageService = fileStorageService;
        this.documentChunkService = documentChunkService;
        this.reviewEnabled = reviewEnabled;
        this.contentHashLockRegistry = contentHashLockRegistry;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleDocumentIngest(DocumentIngestRequested event) {
        Long docId = event.documentId();

        Document doc = findMutableDocument(docId);
        if (doc == null) {
            return;
        }

        try {
            String filePath = resolveInternalFilePath(doc);

            // Đã duyệt thủ công (approve -> INDEXING) hoặc yêu cầu index lại
            // (reindex -> REINDEXING): bỏ qua bước AI review, ingest thẳng.
            // runIngest sẽ chuyển sang READY (thành công) hoặc FAILED (lỗi).
            if (doc.getStatus() == DocumentStatus.INDEXING
                    || doc.getStatus() == DocumentStatus.REINDEXING) {
                log.info("Document {} approved/reindex requested ({}), indexing without AI review",
                        docId, doc.getStatus());
                runIngest(doc, filePath);
                return;
            }

            // Bước 1: AI duyệt nội dung (có thể tắt qua app.document.review.enabled=false)
            RagClassifyResponse verdict = null;
            if (reviewEnabled) {
                doc.setStatus(DocumentStatus.REVIEWING);
                documentRepository.save(doc);
                log.info("Document {} status set to REVIEWING", docId);

                RagClassifyRequest classifyRequest = new RagClassifyRequest(
                        docId, doc.getTitle(), filePath, null, null);
                verdict = classifyWithRetry(classifyRequest, docId);

                doc = findMutableDocument(docId);
                if (doc == null) {
                    return;
                }

                double confidence = verdict != null ? verdict.confidence() : 0.5;
                boolean isHistory = verdict == null || Boolean.TRUE.equals(verdict.isHistory());

                doc.setAiConfidence(confidence);
                doc.setReviewReason(verdict != null ? verdict.reason() : null);

                if (isHistory && confidence >= 0.9) {
                    // === AUTO APPROVE: confidence >= 90% và là lịch sử ===
                    // Giữ status REVIEWING, để AutoApprovalScheduler ingest sau (chạy mỗi phút),
                    // cho user thấy "pending" một khoảng ngắn trước khi thành công.
                    doc.setAiWarningLevel("NONE");
                    doc.setAiReviewStatus("AUTO_APPROVED");
                    documentRepository.save(doc);
                    log.info("Document {} AUTO_APPROVED, chờ scheduler ingest: confidence={}", docId, confidence);
                    return;
                } else if (!isHistory) {
                    doc.setStatus(DocumentStatus.PENDING_REVIEW);
                    doc.setAiWarningLevel("DANGER");
                    doc.setAiReviewStatus("PENDING_ADMIN");
                    documentRepository.save(doc);
                    log.warn("Document {} PENDING_REVIEW (not history): confidence={}, reason={}",
                            docId, confidence, verdict != null ? verdict.reason() : "");
                    return;
                } else {
                    doc.setAiWarningLevel(confidence >= 0.7 ? "WARNING" : "DANGER");
                    doc.setAiReviewStatus("PENDING_ADMIN");
                    doc.setStatus(DocumentStatus.PENDING_REVIEW);
                    documentRepository.save(doc);
                    log.warn("Document {} PENDING_REVIEW (confidence={}): warning={}",
                            docId, confidence, doc.getAiWarningLevel());
                    return;
                }
            }

            // Bước 2: Index vào Qdrant (chỉ chạy khi review bị tắt)
            if (!reviewEnabled) {
                runIngest(doc, filePath);
            }
        } catch (Exception e) {
            log.error("Document {} ingestion error: {}", docId, e.getMessage(), e);
            Document current = documentRepository.findById(docId).orElse(doc);
            if (isLockedStatus(current.getStatus())) {
                log.info("Document {} is {}, skip marking FAILED after ingestion error",
                        docId, current.getStatus());
                return;
            }
            current.setStatus(DocumentStatus.FAILED);
            documentRepository.save(current);
        }
    }

    private void runIngest(Document doc, String filePath) {
        Long id = doc.getId();
        RagIngestMetadata metadata = new RagIngestMetadata(
                null, null, null, java.util.List.of(),
                java.util.List.of(), java.util.List.of(),
                doc.getFolderId(), doc.getOwnerId()
        );

        RagIngestRequest ingestRequest = new RagIngestRequest(
                id, "DOCUMENT", doc.getTitle(), null, id,
                filePath, null, null, metadata, null
        );

        RagIngestResponse response = ragClientService.ingest(ingestRequest, null);

        Document current = findMutableDocument(id);
        if (current == null) return;

        if ("COMPLETED".equals(response.status())) {
            saveIngestedChunks(current, response);
            current.setChunkCount(response.chunks() != null ? response.chunks().size() : 0);
            current.setContentHash(response.documentContentHash());

            String contentHash = response.documentContentHash();
            if (contentHash != null && !contentHash.isBlank()) {
                // Khóa theo contentHash để 2 tài liệu cùng nội dung được ingest gần như đồng
                // thời (2 lượt admin duyệt, hoặc 2 lượt auto-approve) không thể cùng SELECT
                // "không thấy nhau" rồi cùng lọt qua bước gắn cờ DANGER. content_hash chỉ có
                // INDEX thường, không có UNIQUE constraint, nên đây là hàng rào duy nhất.
                Object lock = contentHashLockRegistry.acquire(contentHash);
                synchronized (lock) {
                    Document duplicate = documentRepository
                            .findFirstByContentHashAndOwnerIdNotAndStatusNot(
                                    contentHash, current.getOwnerId(), DocumentStatus.SOFT_DELETED)
                            .orElse(null);
                    if (duplicate != null) {
                        current.setStatus(DocumentStatus.PENDING_REVIEW);
                        current.setAiWarningLevel("DANGER");
                        current.setReviewReason("Trùng nội dung với tài liệu #" + duplicate.getId()
                                + " của người dùng khác — nghi ngờ tải lại tài liệu công khai");
                        current.setAiReviewStatus("PENDING_ADMIN");
                        documentRepository.save(current);
                        log.warn("Document {} content-hash collides with doc #{} (owner {}), set PENDING_REVIEW",
                                id, duplicate.getId(), duplicate.getOwnerId());
                        return;
                    }
                    // Lưu ngay trong lúc giữ lock (save() ở đây tự commit vì không có
                    // @Transactional bao ngoài trong luồng @Async này) để thread khác đang
                    // chờ lock sẽ thấy bản ghi này ngay khi tới lượt SELECT của nó.
                    current.setContentHash(contentHash);
                    documentRepository.save(current);
                }
                contentHashLockRegistry.release(contentHash, lock);
            }

            current.setStatus(DocumentStatus.READY);
            documentRepository.save(current);
            log.info("Document {} ingestion COMPLETED, chunks={}", id, current.getChunkCount());
        } else {
            current.setStatus(DocumentStatus.FAILED);
            documentRepository.save(current);
            log.warn("Document {} ingestion FAILED: {}", id, response.status());
        }
    }

    private void saveIngestedChunks(Document doc, RagIngestResponse response) {
        documentChunkService.deleteByDocumentId(doc.getId());
        if (response.chunks() == null || response.chunks().isEmpty()) {
            return;
        }

        java.util.List<DocumentChunk> chunks = response.chunks().stream()
                .map(chunkResponse -> {
                    DocumentChunk chunk = new DocumentChunk();
                    chunk.setDocument(doc);
                    chunk.setSourceId(response.sourceId());
                    chunk.setSourceType("DOCUMENT");
                    chunk.setChunkIndex(chunkResponse.chunkIndex());
                    chunk.setQdrantPointId(chunkResponse.qdrantPointId());
                    chunk.setContentHash(chunkResponse.contentHash());
                    return chunk;
                })
                .toList();
        documentChunkService.saveAll(chunks);
    }

    private Document findMutableDocument(Long docId) {
        Document doc = documentRepository.findById(docId).orElse(null);
        if (doc == null) {
            log.warn("Document not found for ingestion: {}", docId);
            return null;
        }
        if (isLockedStatus(doc.getStatus())) {
            log.info("Document {} is {}, skip ingestion state changes", docId, doc.getStatus());
            return null;
        }
        return doc;
    }

    private boolean isLockedStatus(DocumentStatus status) {
        return status == DocumentStatus.REJECTED || status == DocumentStatus.SOFT_DELETED;
    }

    private String resolveInternalFilePath(Document doc) {
        return fileStorageService.resolveInternalPath(doc.getPublicId());
    }

    // ── Retry logic for classify ────────────────────────────────────────────

    private static final int CLASSIFY_MAX_RETRIES = 2;
    private static final long CLASSIFY_RETRY_BASE_MS = 1000;

    /**
     * Gọi classify với retry: thử tối đa CLASSIFY_MAX_RETRIES lần
     * với exponential backoff. Nếu tất cả fail, trả null (fail-open)
     * để document không bị stuck ở FAILED.
     */
    private RagClassifyResponse classifyWithRetry(RagClassifyRequest request, Long docId) {
        Exception lastError = null;
        for (int attempt = 0; attempt <= CLASSIFY_MAX_RETRIES; attempt++) {
            try {
                return ragClientService.classify(request, null);
            } catch (Exception e) {
                lastError = e;
                if (attempt < CLASSIFY_MAX_RETRIES) {
                    long delay = CLASSIFY_RETRY_BASE_MS * (1L << attempt);
                    log.warn("Classify attempt {}/{} for doc {} failed: {}. Retrying in {}ms...",
                            attempt + 1, CLASSIFY_MAX_RETRIES + 1, docId, e.getMessage(), delay);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        log.error("Classify failed after {} retries for doc {}: {}",
                CLASSIFY_MAX_RETRIES + 1, docId, lastError != null ? lastError.getMessage() : "unknown");
        return null; // fail-open: để admin duyệt thủ công
    }
}
