package com.example.historyrag.feature.billing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DemoPurchaseRequest(
        @NotBlank
        @Size(max = 50)
        String planCode
) {
}
