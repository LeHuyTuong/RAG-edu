package com.example.historyrag.feature.subject.dto;

import jakarta.validation.constraints.Size;

public record UpdateSubjectRequest(
        @Size(max = 255) String name,
        @Size(max = 50) String code
) {}
