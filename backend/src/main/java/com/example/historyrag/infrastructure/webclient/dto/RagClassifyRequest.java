package com.example.historyrag.infrastructure.webclient.dto;

public record RagClassifyRequest(
        Long sourceId,
        String title,
        String filePath,
        String sourceUrl,
        String rawContent
) {}
