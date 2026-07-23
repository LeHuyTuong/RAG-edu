package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardActivityResponse;
import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.billing.UserSubscriptionService;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserService;

import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MM/yyyy")
            .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final UserService userService;
    private final DocumentService documentService;
    private final SubjectService subjectService;
    private final UserSubscriptionService userSubscriptionService;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        long totalUsers = userService.countAll();
        long totalStudents = userService.countByRole(User.UserRole.STUDENT);
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
        long pendingDocs = uploadingDocs + indexingDocs + reindexingDocs + failedDocs + pendingReviewDocs;
        long subjectCount = subjectService.countAll();

        long activeSubscriptions = userSubscriptionService.countByStatus("ACTIVE");
        Long calculatedRevenue = userSubscriptionService.calculateTotalRevenue();
        long totalRevenue = calculatedRevenue != null ? calculatedRevenue : 0L;

        List<DashboardResponse.RevenueData> revenueChart = buildRevenueChart();

        return new DashboardResponse(
                new DashboardResponse.AccountStats(totalUsers, activeUsers, lockedUsers, 0L),
                new DashboardResponse.DocumentStats(totalDocuments, readyDocs, pendingDocs, rejectedDocs),
                new DashboardResponse.SubjectStats(subjectCount),
                new DashboardResponse.BillingStats(totalRevenue, activeSubscriptions, revenueChart),
                buildActivities(totalStudents, readyDocs, failedDocs, pendingReviewDocs)
        );
    }

    private List<DashboardResponse.RevenueData> buildRevenueChart() {
        YearMonth now = YearMonth.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        Map<String, Long> revenueByMonth = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            revenueByMonth.put(now.minusMonths(i).format(MONTH_FORMATTER), 0L);
        }

        List<Object[]> dbResults = userSubscriptionService.calculateRevenueByMonth();
        for (Object[] row : dbResults) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String monthKey = YearMonth.of(year, month).format(MONTH_FORMATTER);
            Long revenue = ((Number) row[2]).longValue();
            if (revenueByMonth.containsKey(monthKey)) {
                revenueByMonth.put(monthKey, revenue);
            }
        }

        return revenueByMonth.entrySet().stream()
                .map(e -> new DashboardResponse.RevenueData("Tháng " + e.getKey().split("/")[0], e.getValue()))
                .toList();
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
