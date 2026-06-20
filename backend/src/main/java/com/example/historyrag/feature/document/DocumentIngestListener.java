package com.example.historyrag.feature.document;

import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestMetadata;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import com.example.historyrag.infrastructure.webclient.RagClientService;
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

    public DocumentIngestListener(DocumentRepository documentRepository,
                                   RagClientService ragClientService,
                                   @Value("${app.upload.base-path:./uploads}") String uploadBasePath) {
        this.documentRepository = documentRepository;
        this.ragClientService = ragClientService;
        this.uploadBasePath = Paths.get(uploadBasePath).toAbsolutePath().normalize().toString();
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
            doc.setStatus(DocumentStatus.INDEXING);
            documentRepository.save(doc);
            log.info("Document {} status set to INDEXING", docId);

            RagIngestMetadata metadata = new RagIngestMetadata(
                    null, null, null, java.util.List.of(),
                    java.util.List.of(), java.util.List.of(),
                    doc.getFolderId(), doc.getOwnerId()
            );

            // filePath tuyệt đối trên filesystem chung (shared Docker volume /app/uploads)
            String filePath = uploadBasePath + "/" + doc.getPublicId();

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
