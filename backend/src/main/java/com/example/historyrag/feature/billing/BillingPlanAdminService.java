package com.example.historyrag.feature.billing;

import com.example.historyrag.feature.billing.dto.AdminBillingPlanRequest;
import com.example.historyrag.feature.billing.dto.AdminBillingPlanResponse;
import java.util.List;

public interface BillingPlanAdminService {

    List<AdminBillingPlanResponse> findAll();

    AdminBillingPlanResponse findById(Long id);

    AdminBillingPlanResponse create(AdminBillingPlanRequest request);

    AdminBillingPlanResponse update(Long id, AdminBillingPlanRequest request);

    void deactivate(Long id);
}
