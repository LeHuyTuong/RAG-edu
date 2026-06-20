package com.example.historyrag.infrastructure.webclient.dto;

import java.util.Collections;
import java.util.List;

public record RagRetrieveResponse(
        String question,
        Integer topK,
        List<RagRetrieveHitResponse> hits
) {
    public RagRetrieveResponse {
        hits = hits == null ? Collections.emptyList() : List.copyOf(hits);
    }
}
