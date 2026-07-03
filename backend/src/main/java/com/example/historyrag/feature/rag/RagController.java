package com.example.historyrag.feature.rag;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.shared.JwtUtils;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.folder.FolderService;
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
    private final DocumentService documentService;
    private final FolderService folderService;

    public RagController(
            RagService ragService,
            DocumentService documentService,
            FolderService folderService) {
        this.ragService = ragService;
        this.documentService = documentService;
        this.folderService = folderService;
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
        RagChatRequest securedRequest = secureChatRequest(request, userId, isAdmin(jwt));
        return ResponseEntity.ok(ApiResponse.success(ragService.chat(securedRequest, traceparent)));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChat(
            @RequestBody @Valid RagChatRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        Long userId = currentUserId(jwt);
        return ragService.streamChat(secureChatRequest(request, userId, isAdmin(jwt)), traceparent);
    }

    @PostMapping("/retrieve")
    public ResponseEntity<ApiResponse<RagRetrieveResponse>> retrieve(
            @RequestBody @Valid RagRetrieveRequest request,
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "traceparent", required = false) String traceparent) {
        Long userId = currentUserId(jwt);
        RagRetrieveRequest securedRequest = secureRetrieveRequest(request, userId, isAdmin(jwt));
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

    private RagChatRequest secureChatRequest(RagChatRequest request, Long userId, boolean canViewAnyDocument) {
        validateFolderId(request.folderId(), userId);
        validateSourceIds(request.sourceIds(), userId, canViewAnyDocument);
        return new RagChatRequest(
                request.question(),
                request.topK(),
                request.useGraph(),
                request.sourceIds(),
                request.tagIds(),
                request.temperature(),
                request.folderId(),
                securedRagUserId(userId, request.sourceIds(), canViewAnyDocument));
    }

    private RagRetrieveRequest secureRetrieveRequest(RagRetrieveRequest request, Long userId, boolean canViewAnyDocument) {
        validateFolderId(request.folderId(), userId);
        validateSourceIds(request.sourceIds(), userId, canViewAnyDocument);
        return new RagRetrieveRequest(
                request.question(),
                request.topK(),
                request.sourceIds(),
                request.tagIds(),
                request.folderId(),
                securedRagUserId(userId, request.sourceIds(), canViewAnyDocument));
    }

    private RagIngestRequest secureIngestRequest(RagIngestRequest request, Long userId) {
        validateSourceId(request.sourceId(), userId);
        if (request.documentId() != null && !request.documentId().equals(request.sourceId())) {
            throw new InvalidRequestException("documentId must match sourceId");
        }

        RagIngestMetadata metadata = request.metadata() != null
                ? request.metadata()
                : RagIngestMetadata.empty();
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
        if (folderId != null && !folderService.existsByIdAndOwner(folderId, userId)) {
            throw new ResourceNotFoundException("Folder", "id", folderId);
        }
    }

    private void validateSourceId(Long sourceId, Long userId) {
        if (!documentService.existsByIdAndOwner(sourceId, userId)) {
            throw new ResourceNotFoundException("Document", "id", sourceId);
        }
    }

    private void validateSourceIds(List<Long> sourceIds, Long userId, boolean canViewAnyDocument) {
        if (sourceIds == null || sourceIds.isEmpty()) {
            return;
        }
        boolean documentsExist = canViewAnyDocument
                ? documentService.allExistByIds(sourceIds)
                : documentService.allValidByIdsAndOwner(sourceIds, userId);
        if (!documentsExist) {
            throw new ResourceNotFoundException("Document", "id", sourceIds);
        }
    }

    private Long securedRagUserId(Long userId, List<Long> sourceIds, boolean canViewAnyDocument) {
        if (canViewAnyDocument && sourceIds != null && !sourceIds.isEmpty()) {
            return null;
        }
        return userId;
    }

    private boolean isAdmin(Jwt jwt) {
        if ("ADMIN".equalsIgnoreCase(jwt.getClaimAsString("accountType"))) {
            return true;
        }
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles != null && roles.contains("ROLE_ADMIN");
    }

    private Long currentUserId(Jwt jwt) {
        return JwtUtils.getUserId(jwt);
    }
}
