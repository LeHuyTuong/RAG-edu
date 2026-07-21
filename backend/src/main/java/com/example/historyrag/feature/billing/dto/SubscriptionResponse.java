package com.example.historyrag.feature.billing.dto;

import java.time.Instant;

public record SubscriptionResponse(
        Long id,
        String status,
        Instant currentPeriodStart,
        Instant currentPeriodEnd,
        BillingPlanResponse plan
) {
}
