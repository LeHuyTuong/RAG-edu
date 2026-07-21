package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {

    Optional<UserSubscription> findFirstByUserIdAndStatusAndCurrentPeriodEndAfterOrderByCreatedAtDesc(
            Long userId,
            String status,
            Instant now);

    List<UserSubscription> findByUserIdAndStatus(Long userId, String status);

    long countByStatus(String status);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(bp.priceVnd) FROM UserSubscription us JOIN us.plan bp WHERE us.status = 'ACTIVE'")
    Long calculateTotalRevenue();
}
