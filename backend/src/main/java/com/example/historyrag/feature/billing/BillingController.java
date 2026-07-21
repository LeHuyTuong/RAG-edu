package com.example.historyrag.feature.billing;

import com.example.historyrag.feature.billing.dto.BillingSummaryResponse;
import com.example.historyrag.feature.billing.dto.DemoPurchaseRequest;
import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.shared.JwtUtils;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BillingSummaryResponse>> summary(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(ApiResponse.success(billingService.getSummary(JwtUtils.getUserId(jwt))));
    }

    @PostMapping("/demo-purchase")
    public ResponseEntity<ApiResponse<BillingSummaryResponse>> demoPurchase(
            @Valid @RequestBody DemoPurchaseRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        BillingSummaryResponse response = billingService.demoPurchase(JwtUtils.getUserId(jwt), request.planCode());
        return ResponseEntity.ok(ApiResponse.success("Mua gói demo thành công", response));
    }

    @GetMapping("/flow")
    public ResponseEntity<ApiResponse<List<String>>> flow() {
        return ResponseEntity.ok(ApiResponse.success(billingService.getFlowSteps()));
    }
}
