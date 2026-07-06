package com.example.historyrag.feature.billing.dto;

import java.util.List;

public record BillingSummaryResponse(
        SubscriptionResponse currentSubscription,
        UsageQuotaResponse usage,
        List<BillingPlanResponse> availablePlans
) {
}
