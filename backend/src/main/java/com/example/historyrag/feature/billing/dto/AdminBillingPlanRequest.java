package com.example.historyrag.feature.billing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminBillingPlanRequest(
        @NotBlank @Size(max = 50) String code,
        @NotBlank @Size(max = 120) String name,
        @Size(max = 500) String description,
        @NotNull @Min(0) Integer priceVnd,
        @NotBlank @Size(max = 20) String billingCycle,
        @NotNull @Min(0) Integer chatCreditsPerMonth,
        @NotNull @Min(0) Integer documentQuota,
        @NotNull @Min(0) Integer storageMb,
        @NotNull @Min(0) Integer maxFileSizeMb,
        @NotNull @Min(0) Integer displayOrder,
        @NotNull Boolean active
) {
}
