package com.example.historyrag.infrastructure.webclient;

import com.example.historyrag.infrastructure.webclient.dto.RagChatRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagChatResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagClassifyRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagClassifyResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagDeleteResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagHealthResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagRetrieveRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagRetrieveResponse;
import java.util.function.Consumer;
import reactor.core.Disposable;

public interface RagClientService {

    RagHealthResponse getHealth(String traceparent);

    RagChatResponse chat(RagChatRequest request, String traceparent);

    Disposable streamChat(
            RagChatRequest request,
            String traceparent,
            Consumer<RagStreamEvent> onEvent,
            Consumer<Throwable> onError,
            Runnable onComplete);

    RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent);

    RagClassifyResponse classify(RagClassifyRequest request, String traceparent);

    RagIngestResponse ingest(RagIngestRequest request, String traceparent);

    RagDeleteResponse deleteSource(Long sourceId, String traceparent);
}
