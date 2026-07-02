package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardActivityResponse;
import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserService userService;
    private final DocumentService documentService;
    private final SubjectService subjectService;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = userService.countAll();
        long totalStudents = userService.countByRole(User.UserRole.STUDENT);
        long totalAdmins = userService.countByRole(User.UserRole.ADMIN);
        long activeUsers = userService.countByStatus(User.UserStatus.ACTIVE);
        long lockedUsers = userService.countByStatus(User.UserStatus.LOCKED);

        long totalDocuments = documentService.countAll();
        long readyDocs = documentService.countByStatus(DocumentStatus.READY);
        long rejectedDocs = documentService.countByStatus(DocumentStatus.REJECTED);
        long pendingReviewDocs = documentService.countByStatus(DocumentStatus.PENDING_REVIEW);
        long uploadingDocs = documentService.countByStatus(DocumentStatus.UPLOADING);
        long indexingDocs = documentService.countByStatus(DocumentStatus.INDEXING);
        long reindexingDocs = documentService.countByStatus(DocumentStatus.REINDEXING);
        long failedDocs = documentService.countByStatus(DocumentStatus.FAILED);
        // PENDING = all processing states (uploading + indexing + reindexing + failed)
        long pendingDocs = uploadingDocs + indexingDocs + reindexingDocs + failedDocs;
        long subjectCount = subjectService.countAll();

        return new DashboardResponse(
                new DashboardResponse.AccountStats(totalUsers, activeUsers, lockedUsers, totalStudents),
                new DashboardResponse.DocumentStats(totalDocuments, readyDocs, pendingDocs, rejectedDocs),
                new DashboardResponse.SubjectStats(subjectCount),
                buildActivities(totalStudents, readyDocs, failedDocs, pendingReviewDocs)
        );
    }

    private List<DashboardActivityResponse> buildActivities(
            long totalStudents, long readyDocs, long failedDocs, long pendingReviewDocs) {
        List<DashboardActivityResponse> activities = new ArrayList<>();
        if (pendingReviewDocs > 0) {
            activities.add(new DashboardActivityResponse(
                    "pending-review-docs",
                    "rate_review",
                    "text-yellow-700",
                    "bg-yellow-100",
                    "Có " + pendingReviewDocs + " tài liệu chờ admin duyệt",
                    "Cần duyệt"
            ));
        }
        if (failedDocs > 0) {
            activities.add(new DashboardActivityResponse(
                    "failed-docs",
                    "error_outline",
                    "text-red-700",
                    "bg-red-100",
                    "Có " + failedDocs + " tài liệu index thất bại",
                    "Cần xử lý"
            ));
        }
        activities.add(new DashboardActivityResponse(
                "ready-docs",
                "auto_stories",
                "text-primary",
                "bg-surface-variant",
                "Có " + readyDocs + " tài liệu đã sẵn sàng tra cứu",
                "Dữ liệu"
        ));
        activities.add(new DashboardActivityResponse(
                "student-total",
                "group",
                "text-on-surface",
                "bg-accent/10",
                "Hệ thống có " + totalStudents + " học sinh",
                "Hiện tại"
        ));
        return activities;
    }
}
