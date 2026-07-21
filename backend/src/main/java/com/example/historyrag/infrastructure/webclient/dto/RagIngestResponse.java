package com.example.historyrag.infrastructure.webclient.dto;

import java.util.Collections;
import java.util.List;

public record RagIngestResponse(
        Long sourceId,
        String status,
        String collection,
        String embeddingModel,
        String documentContentHash,
        List<RagIngestedChunkResponse> chunks
) {
    public RagIngestResponse {
        chunks = chunks == null ? Collections.emptyList() : List.copyOf(chunks);
    }
}
