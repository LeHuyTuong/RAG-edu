package com.example.historyrag.feature.billing;

import java.util.List;
import java.util.Optional;

public interface BillingPlanService {
    List<BillingPlan> findAllByOrderByDisplayOrderAsc();
    List<BillingPlan> findByActiveTrueOrderByDisplayOrderAsc();
    Optional<BillingPlan> findByCodeAndActiveTrue(String code);
    Optional<BillingPlan> findById(Long id);
    BillingPlan save(BillingPlan plan);
    boolean existsByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);
}
