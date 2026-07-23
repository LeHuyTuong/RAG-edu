package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionService {
    Optional<UserSubscription> findActiveSubscription(Long userId, Instant now);
    List<UserSubscription> findByUserIdAndStatus(Long userId, String status);
    UserSubscription save(UserSubscription subscription);
    void saveAll(Iterable<UserSubscription> subscriptions);
    long countByStatus(String status);
    Long calculateTotalRevenue();
    List<Object[]> calculateRevenueByMonth();
}
