package com.example.historyrag.feature.billing;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.billing.dto.AdminBillingPlanRequest;
import com.example.historyrag.feature.billing.dto.AdminBillingPlanResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillingPlanAdminServiceImpl implements BillingPlanAdminService {

    private final BillingPlanRepository planRepository;

    public BillingPlanAdminServiceImpl(BillingPlanRepository planRepository) {
        this.planRepository = planRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminBillingPlanResponse> findAll() {
        return planRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminBillingPlanResponse findById(Long id) {
        return toResponse(findPlan(id));
    }

    @Override
    @Transactional
    public AdminBillingPlanResponse create(AdminBillingPlanRequest request) {
        String code = normalizeCode(request.code());
        validateBillingCycle(request.billingCycle());

        if (planRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("BillingPlan", "code", code);
        }

        BillingPlan plan = new BillingPlan();
        applyRequest(plan, request, code);
        return toResponse(planRepository.save(plan));
    }

    @Override
    @Transactional
    public AdminBillingPlanResponse update(Long id, AdminBillingPlanRequest request) {
        BillingPlan plan = findPlan(id);
        String code = normalizeCode(request.code());
        validateBillingCycle(request.billingCycle());

        if (planRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new DuplicateResourceException("BillingPlan", "code", code);
        }

        applyRequest(plan, request, code);
        return toResponse(planRepository.save(plan));
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        BillingPlan plan = findPlan(id);
        plan.setActive(false);
        planRepository.save(plan);
    }

    private BillingPlan findPlan(Long id) {
        return planRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BillingPlan", "id", id));
    }

    private void applyRequest(BillingPlan plan, AdminBillingPlanRequest request, String code) {
        plan.setCode(code);
        plan.setName(request.name().trim());
        plan.setDescription(normalizeNullableText(request.description()));
        plan.setPriceVnd(request.priceVnd());
        plan.setBillingCycle(request.billingCycle().trim().toUpperCase());
        plan.setChatCreditsPerMonth(request.chatCreditsPerMonth());
        plan.setDocumentQuota(request.documentQuota());
        plan.setStorageMb(request.storageMb());
        plan.setMaxFileSizeMb(request.maxFileSizeMb());
        plan.setDisplayOrder(request.displayOrder());
        plan.setActive(request.active());
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase();
    }

    private String normalizeNullableText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private void validateBillingCycle(String billingCycle) {
        String normalized = billingCycle.trim().toUpperCase();
        if (!BillingConstants.SUPPORTED_BILLING_CYCLES.contains(normalized)) {
            throw new InvalidRequestException("Chu kỳ thanh toán không hợp lệ");
        }
    }

    private AdminBillingPlanResponse toResponse(BillingPlan plan) {
        return new AdminBillingPlanResponse(
                plan.getId(),
                plan.getCode(),
                plan.getName(),
                plan.getDescription(),
                plan.getPriceVnd(),
                plan.getBillingCycle(),
                plan.getChatCreditsPerMonth(),
                plan.getDocumentQuota(),
                plan.getStorageMb(),
                plan.getMaxFileSizeMb(),
                plan.getDisplayOrder(),
                plan.getActive(),
                plan.getCreatedAt(),
                plan.getUpdatedAt());
    }
}
