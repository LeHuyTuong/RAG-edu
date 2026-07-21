package com.example.historyrag.infrastructure.scheduler;

import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.admin.setting.SystemSettingService;
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
    private final SystemSettingService systemSettingService;
    private final int defaultRetentionDays;

    public SoftDeleteCleanupScheduler(
            DocumentService documentService,
            SystemSettingService systemSettingService,
            @Value("${app.soft-delete.retention-days:30}") int defaultRetentionDays) {
        this.documentService = documentService;
        this.systemSettingService = systemSettingService;
        this.defaultRetentionDays = defaultRetentionDays;
    }

    @Scheduled(cron = "${app.soft-delete.cron:0 0 2 * * *}")
    public void purgeExpiredSoftDeleted() {
        int retentionDays = defaultRetentionDays;
        try {
            String retentionStr = systemSettingService.getSettingValue("SOFT_DELETE_RETENTION_DAYS", String.valueOf(defaultRetentionDays));
            retentionDays = Integer.parseInt(retentionStr);
        } catch (Exception e) {
            log.warn("Lỗi khi đọc cấu hình SOFT_DELETE_RETENTION_DAYS, dùng giá trị mặc định: {}", defaultRetentionDays);
        }

        Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
        log.info("Soft-delete cleanup scheduled: retentionDays={}", retentionDays);
        documentService.purgeExpiredSoftDeleted(cutoff);
    }
}