package com.example.historyrag.feature.billing.dto;

public record BillingPlanResponse(
        Long id,
        String code,
        String name,
        String description,
        Integer priceVnd,
        String billingCycle,
        Integer chatCreditsPerMonth,
        Integer documentQuota,
        Integer storageMb,
        Integer maxFileSizeMb,
        Boolean active
) {
}
