package com.example.historyrag.feature.rag;

import com.example.historyrag.infrastructure.webclient.dto.RagChatRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagChatResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagDeleteResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagHealthResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagRetrieveRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagRetrieveResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface RagService {

    RagHealthResponse getHealth(String traceparent);

    RagChatResponse chat(RagChatRequest request, String traceparent);

    SseEmitter streamChat(RagChatRequest request, String traceparent);

    RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent);

    RagIngestResponse ingest(RagIngestRequest request, String traceparent);

    RagDeleteResponse deleteSource(Long sourceId, String traceparent);
}
