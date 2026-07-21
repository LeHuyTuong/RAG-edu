package com.example.historyrag.feature.billing;

import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BillingPlanServiceImpl implements BillingPlanService {

    private final BillingPlanRepository repository;

    @Override
    @Transactional(readOnly = true)
    public List<BillingPlan> findAllByOrderByDisplayOrderAsc() {
        return repository.findAllByOrderByDisplayOrderAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillingPlan> findByActiveTrueOrderByDisplayOrderAsc() {
        return repository.findByActiveTrueOrderByDisplayOrderAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BillingPlan> findByCodeAndActiveTrue(String code) {
        return repository.findByCodeAndActiveTrue(code);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BillingPlan> findById(Long id) {
        return repository.findById(id);
    }

    @Override
    @Transactional
    public BillingPlan save(BillingPlan plan) {
        return repository.save(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByCodeIgnoreCase(String code) {
        return repository.existsByCodeIgnoreCase(code);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id) {
        return repository.existsByCodeIgnoreCaseAndIdNot(code, id);
    }
}
