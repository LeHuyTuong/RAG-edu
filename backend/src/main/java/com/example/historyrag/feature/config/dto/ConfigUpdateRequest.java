package com.example.historyrag.feature.config.dto;

public record ConfigUpdateRequest(
        String allowedTypes,
        String maxSizeMb
) {}
