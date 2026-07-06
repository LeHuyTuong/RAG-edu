package com.example.historyrag.feature.billing.dto;

import java.time.Instant;

public record UsageQuotaResponse(
        Instant periodStart,
        Instant periodEnd,
        Integer chatLimit,
        Integer chatUsed,
        Integer chatRemaining,
        Integer documentLimit,
        Integer documentUsed,
        Integer documentRemaining,
        Integer storageMbLimit,
        Integer storageMbUsed,
        Integer storageMbRemaining
) {
}
