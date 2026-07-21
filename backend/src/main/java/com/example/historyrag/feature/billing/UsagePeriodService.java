package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UsagePeriodService {
    Optional<UsagePeriod> findCurrentUsage(Long userId, Instant nowStart, Instant nowEnd);
    List<UsagePeriod> lockCurrentUsageForUpdate(Long userId, Instant now);
    UsagePeriod save(UsagePeriod usagePeriod);
}
