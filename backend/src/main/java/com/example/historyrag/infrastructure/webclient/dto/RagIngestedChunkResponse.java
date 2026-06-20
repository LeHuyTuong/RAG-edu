package com.example.historyrag.infrastructure.webclient.dto;

public record RagIngestedChunkResponse(
        Integer chunkIndex,
        String qdrantPointId,
        String contentHash
) {
}
