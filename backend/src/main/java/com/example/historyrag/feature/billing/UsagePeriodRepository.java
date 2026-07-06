package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsagePeriodRepository extends JpaRepository<UsagePeriod, Long> {

    Optional<UsagePeriod> findFirstByUserIdAndPeriodStartLessThanEqualAndPeriodEndAfterOrderByCreatedAtDesc(
            Long userId,
            Instant nowStart,
            Instant nowEnd);
}
