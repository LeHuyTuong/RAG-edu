package com.example.historyrag.infrastructure.scheduler;

import com.example.historyrag.feature.document.DocumentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Tự động xóa vĩnh viễn document SOFT_DELETED quá retentionDays ngày.
 * Chạy mỗi đêm lúc 2:00 AM.
 */
@Component
public class SoftDeleteCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(SoftDeleteCleanupScheduler.class);

    private final DocumentService documentService;
    private final int retentionDays;

    public SoftDeleteCleanupScheduler(
            DocumentService documentService,
            @Value("${app.soft-delete.retention-days:30}") int retentionDays) {
        this.documentService = documentService;
        this.retentionDays = retentionDays;
    }

    @Scheduled(cron = "${app.soft-delete.cron:0 0 2 * * *}")
    public void purgeExpiredSoftDeleted() {
        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        log.info("Soft-delete cleanup scheduled: retentionDays={}", retentionDays);
        documentService.purgeExpiredSoftDeleted(cutoff);
    }
}