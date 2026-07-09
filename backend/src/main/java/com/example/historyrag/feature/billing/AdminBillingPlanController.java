package com.example.historyrag.feature.billing;

import com.example.historyrag.feature.billing.dto.AdminBillingPlanRequest;
import com.example.historyrag.feature.billing.dto.AdminBillingPlanResponse;
import com.example.historyrag.shared.ApiResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(BillingApiPaths.ADMIN_BILLING_PLANS)
@PreAuthorize("hasRole('ADMIN')")
public class AdminBillingPlanController {

    private final BillingPlanAdminService planAdminService;

    public AdminBillingPlanController(BillingPlanAdminService planAdminService) {
        this.planAdminService = planAdminService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminBillingPlanResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(planAdminService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminBillingPlanResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(planAdminService.findById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminBillingPlanResponse>> create(
            @Valid @RequestBody AdminBillingPlanRequest request) {
        AdminBillingPlanResponse response = planAdminService.create(request);
        URI location = URI.create(BillingApiPaths.ADMIN_BILLING_PLANS + "/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo gói thành công", response));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminBillingPlanResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody AdminBillingPlanRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật gói thành công", planAdminService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        planAdminService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("Ngừng kích hoạt gói thành công", null));
    }
}
