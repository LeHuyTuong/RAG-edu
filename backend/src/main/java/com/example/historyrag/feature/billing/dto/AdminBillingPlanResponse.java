package com.example.historyrag.feature.billing.dto;

import java.time.Instant;

public record AdminBillingPlanResponse(
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
        Integer displayOrder,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
