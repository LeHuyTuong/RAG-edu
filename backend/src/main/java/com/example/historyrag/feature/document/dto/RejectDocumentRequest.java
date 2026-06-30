package com.example.historyrag.feature.document.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectDocumentRequest(
        @NotBlank(message = "rejectionReason is required")
        String rejectionReason
) {
}
