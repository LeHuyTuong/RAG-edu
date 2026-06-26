package com.example.historyrag.feature.rag;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.shared.JwtUtils;
import com.example.historyrag.feature.document.DocumentRepository;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.folder.FolderRepository;
import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagChatRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagChatResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagDeleteResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagHealthResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestMetadata;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagRetrieveRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagRetrieveResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {

    private final RagService ragService;
    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;

    public RagController(
            RagService ragService,
            DocumentRepository documentRepository,
            FolderRepository folderRepository) {
        this.ragService = ragService;
        this.documentRepository = documentRepository;
        this.folderRepository = folderRepository;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<RagHealthResponse>> getHealth(
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        return ResponseEntity.ok(ApiResponse.success(ragService.getHealth(traceparent)));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<RagChatResponse>> chat(
            @RequestBody @Valid RagChatRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        Long userId = currentUserId(jwt);
        RagChatRequest securedRequest = secureChatRequest(request, userId);
        return ResponseEntity.ok(ApiResponse.success(ragService.chat(securedRequest, traceparent)));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @RequestBody @Valid RagChatRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        Long userId = currentUserId(jwt);
        return ragService.streamChat(secureChatRequest(request, userId), traceparent);
    }

    @PostMapping("/retrieve")
    public ResponseEntity<ApiResponse<RagRetrieveResponse>> retrieve(
            @RequestBody @Valid RagRetrieveRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        Long userId = currentUserId(jwt);
        RagRetrieveRequest securedRequest = secureRetrieveRequest(request, userId);
        return ResponseEntity.ok(ApiResponse.success(ragService.retrieve(securedRequest, traceparent)));
    }

    @PostMapping("/ingest")
    public ResponseEntity<ApiResponse<RagIngestResponse>> ingest(
            @RequestBody @Valid RagIngestRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        Long userId = currentUserId(jwt);
        return ResponseEntity.ok(ApiResponse.success(ragService.ingest(secureIngestRequest(request, userId), traceparent)));
    }

    @DeleteMapping("/sources/{sourceId}")
    public ResponseEntity<ApiResponse<RagDeleteResponse>> deleteSource(
            @PathVariable Long sourceId,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        validateSourceId(sourceId, currentUserId(jwt));
        return ResponseEntity.ok(ApiResponse.success(ragService.deleteSource(sourceId, traceparent)));
    }

    private RagChatRequest secureChatRequest(RagChatRequest request, Long userId) {
        validateFolderId(request.folderId(), userId);
        validateSourceIds(request.sourceIds(), userId);
        return new RagChatRequest(
                request.question(),
                request.topK(),
                request.useGraph(),
                request.sourceIds(),
                request.tagIds(),
                request.temperature(),
                request.folderId(),
                userId);
    }

    private RagRetrieveRequest secureRetrieveRequest(RagRetrieveRequest request, Long userId) {
        validateFolderId(request.folderId(), userId);
        validateSourceIds(request.sourceIds(), userId);
        return new RagRetrieveRequest(
                request.question(),
                request.topK(),
                request.sourceIds(),
                request.tagIds(),
                request.folderId(),
                userId);
    }

    private RagIngestRequest secureIngestRequest(RagIngestRequest request, Long userId) {
        validateSourceId(request.sourceId(), userId);
        if (request.documentId() != null && !request.documentId().equals(request.sourceId())) {
            throw new InvalidRequestException("documentId must match sourceId");
        }

        RagIngestMetadata metadata = request.metadata();
        validateFolderId(metadata.folderId(), userId);
        RagIngestMetadata securedMetadata = new RagIngestMetadata(
                metadata.categoryId(),
                metadata.categoryName(),
                metadata.slug(),
                metadata.tagIds(),
                metadata.eventIds(),
                metadata.periodIds(),
                metadata.folderId(),
                userId);

        return new RagIngestRequest(
                request.sourceId(),
                request.sourceType(),
                request.title(),
                request.articleId(),
                request.sourceId(),
                request.filePath(),
                request.sourceUrl(),
                request.rawContent(),
                securedMetadata,
                request.settings());
    }

    private void validateFolderId(Long folderId, Long userId) {
        if (folderId != null && !folderRepository.existsByIdAndOwnerId(folderId, userId)) {
            throw new ResourceNotFoundException("Folder", "id", folderId);
        }
    }

    private void validateSourceId(Long sourceId, Long userId) {
        if (!documentRepository.existsByIdAndOwnerIdAndStatusNot(sourceId, userId, DocumentStatus.SOFT_DELETED)) {
            throw new ResourceNotFoundException("Document", "id", sourceId);
        }
    }

    private void validateSourceIds(List<Long> sourceIds, Long userId) {
        if (sourceIds == null || sourceIds.isEmpty()) {
            return;
        }
        List<Long> distinctIds = sourceIds.stream().distinct().toList();
        long ownedCount = documentRepository.countByIdInAndOwnerIdAndStatusNot(
                distinctIds,
                userId,
                DocumentStatus.SOFT_DELETED);
        if (ownedCount != distinctIds.size()) {
            throw new ResourceNotFoundException("Document", "id", sourceIds);
        }
    }

    private Long currentUserId(Jwt jwt) {
        return JwtUtils.getUserId(jwt);
    }
}
