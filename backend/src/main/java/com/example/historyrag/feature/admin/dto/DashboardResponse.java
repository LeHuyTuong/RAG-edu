package com.example.historyrag.feature.admin.dto;

import java.util.List;

public record DashboardResponse(
        long totalUsers,
        long totalStudents,
        long totalAdmins,
        long totalDocuments,
        long uploadingDocs,
        long indexingDocs,
        long reindexingDocs,
        long readyDocs,
        long failedDocs,
        List<DashboardActivityResponse> activities
) {
}
