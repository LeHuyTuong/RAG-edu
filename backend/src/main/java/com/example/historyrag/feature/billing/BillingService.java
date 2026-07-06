package com.example.historyrag.feature.billing;

import com.example.historyrag.feature.billing.dto.BillingSummaryResponse;
import java.util.List;

public interface BillingService {

    BillingSummaryResponse getSummary(Long userId);

    BillingSummaryResponse demoPurchase(Long userId, String planCode);

    void consumeChatCredit(Long userId, String description);

    List<String> getFlowSteps();
}
