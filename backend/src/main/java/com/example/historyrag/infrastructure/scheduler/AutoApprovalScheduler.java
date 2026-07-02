package com.example.historyrag.infrastructure.scheduler;

import com.example.historyrag.feature.document.DocumentService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Quét các document đã được AI auto-approve (confidence >= 90%) và đang chờ
 * ở trạng thái REVIEWING, để ingest và chuyển sang READY.
 * Chạy mỗi phút để user luôn thấy "pending" một khoảng ngắn trước khi thành công,
 * thay vì ingest ngay lập tức trong luồng xử lý bất đồng bộ ban đầu.
 */
@Component
public class AutoApprovalScheduler {

    private final DocumentService documentService;

    public AutoApprovalScheduler(DocumentService documentService) {
        this.documentService = documentService;
    }

    @Scheduled(cron = "${app.auto-approve.cron:0 * * * * *}")
    public void promoteAutoApprovedDocuments() {
        documentService.processAutoApprovedDocuments();
    }
}
