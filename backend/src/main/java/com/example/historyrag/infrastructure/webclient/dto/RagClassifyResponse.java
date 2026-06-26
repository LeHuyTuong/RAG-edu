package com.example.historyrag.infrastructure.webclient.dto;

public record RagClassifyResponse(
        Long sourceId,
        Boolean isHistory,
        Double confidence,
        String label,
        String reason
) {}
