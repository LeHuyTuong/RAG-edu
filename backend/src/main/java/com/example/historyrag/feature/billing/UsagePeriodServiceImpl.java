package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UsagePeriodServiceImpl implements UsagePeriodService {

    private final UsagePeriodRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Optional<UsagePeriod> findCurrentUsage(Long userId, Instant nowStart, Instant nowEnd) {
        return repository.findFirstByUserIdAndPeriodStartLessThanEqualAndPeriodEndAfterOrderByCreatedAtDesc(
                userId, nowStart, nowEnd);
    }

    @Override
    @Transactional
    public List<UsagePeriod> lockCurrentUsageForUpdate(Long userId, Instant now) {
        return repository.lockCurrentUsageForUpdate(userId, now);
    }

    @Override
    @Transactional
    public UsagePeriod save(UsagePeriod usagePeriod) {
        return repository.save(usagePeriod);
    }
}
