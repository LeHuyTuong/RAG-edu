package com.example.historyrag.feature.admin.dto;

import java.util.List;

public record DashboardResponse(
        AccountStats accounts,
        DocumentStats documents,
        SubjectStats subjects,
        List<DashboardActivityResponse> activities
) {
    public record AccountStats(long total, long active, long banned, long unverified) {}
    public record DocumentStats(long total, long active, long pending, long rejected) {}
    public record SubjectStats(long total) {}
}
