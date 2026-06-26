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
import java.time.Duration;
import java.util.function.Consumer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.Disposable;

@Service
public class RagClientServiceImpl implements RagClientService {

    private static final String TRACE_PARENT_HEADER = "traceparent";

    private final WebClient webClient;
    private final Duration requestTimeout;

    public RagClientServiceImpl(
            WebClient.Builder webClientBuilder,
            @Value("${app.rag.base-url}") String ragBaseUrl,
            @Value("${app.rag.request-timeout:60s}") Duration requestTimeout) {
        this.webClient = webClientBuilder.baseUrl(ragBaseUrl).build();
        this.requestTimeout = requestTimeout;
    }

    // ── Generic request helpers ─────────────────────────────────────────────

    private <T, R> R post(String uri, T request, String traceparent, Class<R> responseType) {
        return webClient.post()
                .uri(uri)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .headers(headers -> setTraceparent(headers, traceparent))
                .bodyValue(request)
                .retrieve()
                .bodyToMono(responseType)
                .block(requestTimeout);
    }

    private <R> R get(String uri, String traceparent, Class<R> responseType) {
        return webClient.get()
                .uri(uri)
                .headers(headers -> setTraceparent(headers, traceparent))
                .retrieve()
                .bodyToMono(responseType)
                .block(requestTimeout);
    }

    private <R> R delete(String uri, String traceparent, Class<R> responseType) {
        return webClient.delete()
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .headers(headers -> setTraceparent(headers, traceparent))
                .retrieve()
                .bodyToMono(responseType)
                .block(requestTimeout);
    }

    // ── Interface implementation ────────────────────────────────────────────

    @Override
    public RagHealthResponse getHealth(String traceparent) {
        return get("/rag/health", traceparent, RagHealthResponse.class);
    }

    @Override
    public RagChatResponse chat(RagChatRequest request, String traceparent) {
        return post("/rag/chat", request, traceparent, RagChatResponse.class);
    }

    @Override
    public Disposable streamChat(
            RagChatRequest request,
            String traceparent,
            Consumer<RagStreamEvent> onEvent,
            Consumer<Throwable> onError,
            Runnable onComplete) {
        return webClient.post()
                .uri("/rag/chat/stream")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .headers(headers -> setTraceparent(headers, traceparent))
                .bodyValue(request)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {
                })
                .subscribe(
                        event -> onEvent.accept(toStreamEvent(event)),
                        onError,
                        onComplete);
    }

    @Override
    public RagRetrieveResponse retrieve(RagRetrieveRequest request, String traceparent) {
        return post("/rag/retrieve", request, traceparent, RagRetrieveResponse.class);
    }

    @Override
    public RagClassifyResponse classify(RagClassifyRequest request, String traceparent) {
        return post("/rag/classify", request, traceparent, RagClassifyResponse.class);
    }

    @Override
    public RagIngestResponse ingest(RagIngestRequest request, String traceparent) {
        return post("/rag/ingest", request, traceparent, RagIngestResponse.class);
    }

    @Override
    public RagDeleteResponse deleteSource(Long sourceId, String traceparent) {
        String uri = "/rag/delete?sourceId=" + sourceId;
        return delete(uri, traceparent, RagDeleteResponse.class);
    }

    private void setTraceparent(HttpHeaders headers, String traceparent) {
        if (traceparent != null && !traceparent.isBlank()) {
            headers.set(TRACE_PARENT_HEADER, traceparent);
        }
    }

    private RagStreamEvent toStreamEvent(ServerSentEvent<String> event) {
        String eventName = event.event() == null || event.event().isBlank()
                ? "message"
                : event.event();
        String data = event.data() == null || event.data().isBlank() ? "{}" : event.data();
        return new RagStreamEvent(eventName, data);
    }
}
