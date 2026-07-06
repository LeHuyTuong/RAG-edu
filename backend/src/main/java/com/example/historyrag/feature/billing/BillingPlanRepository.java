package com.example.historyrag.feature.billing;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillingPlanRepository extends JpaRepository<BillingPlan, Long> {

    List<BillingPlan> findByActiveTrueOrderByDisplayOrderAsc();

    Optional<BillingPlan> findByCodeAndActiveTrue(String code);
}
