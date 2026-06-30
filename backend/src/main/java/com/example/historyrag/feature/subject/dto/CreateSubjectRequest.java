package com.example.historyrag.feature.subject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSubjectRequest(
        @NotBlank @Size(max = 255) String name,
        @NotBlank @Size(max = 50) String code
) {}
