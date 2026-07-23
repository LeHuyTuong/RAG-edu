package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSubscriptionServiceImpl implements UserSubscriptionService {

    private final UserSubscriptionRepository repository;

    @Override
    @Transactional(readOnly = true)
    public Optional<UserSubscription> findActiveSubscription(Long userId, Instant now) {
        return repository.findFirstByUserIdAndStatusAndCurrentPeriodEndAfterOrderByCreatedAtDesc(
                userId, BillingConstants.STATUS_ACTIVE, now);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSubscription> findByUserIdAndStatus(Long userId, String status) {
        return repository.findByUserIdAndStatus(userId, status);
    }

    @Override
    @Transactional
    public UserSubscription save(UserSubscription subscription) {
        return repository.save(subscription);
    }

    @Override
    @Transactional
    public void saveAll(Iterable<UserSubscription> subscriptions) {
        repository.saveAll(subscriptions);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return repository.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public Long calculateTotalRevenue() {
        return repository.calculateTotalRevenue();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Object[]> calculateRevenueByMonth() {
        return repository.calculateRevenueByMonth();
    }
}
