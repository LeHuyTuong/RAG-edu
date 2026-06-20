package com.example.historyrag.infrastructure.webclient.dto;

public record RagCitationResponse(
        String sourceType,
        Long sourceId,
        Long articleId,
        Long documentId,
        String title,
        String slug,
        Integer pageNumber,
        Integer chunkIndex,
        Double score,
        String snippet
) {
}
