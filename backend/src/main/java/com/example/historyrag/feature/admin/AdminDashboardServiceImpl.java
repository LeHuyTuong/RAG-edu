package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardActivityResponse;
import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final UserService userService;
    private final DocumentService documentService;

    public AdminDashboardServiceImpl(UserService userService,
                                     DocumentService documentService) {
        this.userService = userService;
        this.documentService = documentService;
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = userService.countAll();
        long totalStudents = userService.countByRole(User.UserRole.STUDENT);
        long totalAdmins = userService.countByRole(User.UserRole.ADMIN);

        long totalDocuments = documentService.countAll();
        long uploadingDocs = documentService.countByStatus(DocumentStatus.UPLOADING);
        long indexingDocs = documentService.countByStatus(DocumentStatus.INDEXING);
        long reindexingDocs = documentService.countByStatus(DocumentStatus.REINDEXING);
        long readyDocs = documentService.countByStatus(DocumentStatus.READY);
        long failedDocs = documentService.countByStatus(DocumentStatus.FAILED);

        return new DashboardResponse(
                totalUsers,
                totalStudents,
                totalAdmins,
                totalDocuments,
                uploadingDocs,
                indexingDocs,
                reindexingDocs,
                readyDocs,
                failedDocs,
                buildActivities(totalStudents, readyDocs, failedDocs)
        );
    }

    private List<DashboardActivityResponse> buildActivities(
            long totalStudents, long readyDocs, long failedDocs) {
        List<DashboardActivityResponse> activities = new ArrayList<>();
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
