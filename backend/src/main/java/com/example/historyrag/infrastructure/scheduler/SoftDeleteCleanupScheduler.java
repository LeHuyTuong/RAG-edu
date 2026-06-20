package com.example.historyrag.infrastructure.scheduler;

import com.example.historyrag.feature.document.Document;
import com.example.historyrag.feature.document.DocumentRepository;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Tự động xóa vĩnh viễn document SOFT_DELETED quá retentionDays ngày.
 * Chạy mỗi đêm lúc 2:00 AM.
 */
@Component
public class SoftDeleteCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(SoftDeleteCleanupScheduler.class);

    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final RagClientService ragClientService;
    private final int retentionDays;

    public SoftDeleteCleanupScheduler(
            DocumentRepository documentRepository,
            FileStorageService fileStorageService,
            RagClientService ragClientService,
            @Value("${app.soft-delete.retention-days:30}") int retentionDays) {
        this.documentRepository = documentRepository;
        this.fileStorageService = fileStorageService;
        this.ragClientService = ragClientService;
        this.retentionDays = retentionDays;
    }

    @Scheduled(cron = "${app.soft-delete.cron:0 0 2 * * *}")
    @Transactional
    public void purgeExpiredSoftDeleted() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        List<Document> expired = documentRepository
                .findByStatusAndUpdatedAtBefore(DocumentStatus.SOFT_DELETED, cutoff);

        if (expired.isEmpty()) {
            log.debug("Soft-delete cleanup: nothing to purge");
            return;
        }

        log.info("Soft-delete cleanup: purging {} document(s) older than {} days", expired.size(), retentionDays);

        for (Document doc : expired) {
            try {
                ragClientService.deleteSource(doc.getId(), null);
            } catch (Exception e) {
                log.warn("Failed to delete Qdrant vectors for doc {}: {}", doc.getId(), e.getMessage());
            }
            fileStorageService.delete(doc.getPublicId());
            documentRepository.delete(doc);
            log.info("Purged document id={} title={}", doc.getId(), doc.getTitle());
        }
    }
}
