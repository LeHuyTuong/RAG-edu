package com.example.historyrag.feature.billing;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UsagePeriodRepository extends JpaRepository<UsagePeriod, Long> {

    Optional<UsagePeriod> findFirstByUserIdAndPeriodStartLessThanEqualAndPeriodEndAfterOrderByCreatedAtDesc(
            Long userId,
            Instant nowStart,
            Instant nowEnd);

    // Dùng riêng cho luồng tiêu thụ quota (consumeChatCredit/consumeDocumentQuota): khóa
    // SELECT ... FOR UPDATE ở tầng DB để 2 request đồng thời không thể cùng đọc số đếm cũ
    // rồi cùng "lách" qua kiểm tra hạn mức (race condition/lost update). Không dùng cho các
    // luồng chỉ đọc (getSummary) để tránh khóa không cần thiết khi user chỉ xem trang billing.
    @Query(value = "SELECT * FROM usage_period WHERE user_id = :userId AND period_start <= :now AND period_end > :now ORDER BY created_at DESC FOR UPDATE", nativeQuery = true)
    List<UsagePeriod> lockCurrentUsageForUpdate(@Param("userId") Long userId, @Param("now") Instant now);
}
