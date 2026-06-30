package com.example.historyrag.feature.document;

import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.shared.JwtUtils;
import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentPageResponse;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.ShareLinkResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DocumentResponse>> create(
            @Valid @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        DocumentResponse response = documentService.create(request, ownerId);
        URI location = URI.create("/api/v1/documents/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo tài liệu thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<DocumentPageResponse>> filter(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean onlyMine,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "12") int limit,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        DocumentStatus mappedStatus = mapStatusFilter(status);
        ResultPaginationDTO result = documentService.filter(
                search, folderId, mappedStatus, ownerId, onlyMine,
                org.springframework.data.domain.PageRequest.of(page - 1, limit));
        @SuppressWarnings("unchecked")
        java.util.List<DocumentResponse> docs = (java.util.List<DocumentResponse>) result.result();
        DocumentPageResponse response = new DocumentPageResponse(
                docs,
                new DocumentPageResponse.PageMeta(
                        result.meta().page(),
                        result.meta().pageSize(),
                        result.meta().total(),
                        result.meta().pages()
                )
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<DocumentPageResponse>> getMyDocuments(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        DocumentStatus mappedStatus = mapStatusFilter(status);
        ResultPaginationDTO result = documentService.filter(
                null, null, mappedStatus, ownerId, true,
                org.springframework.data.domain.PageRequest.of(page - 1, limit));
        @SuppressWarnings("unchecked")
        java.util.List<DocumentResponse> docs = (java.util.List<DocumentResponse>) result.result();
        DocumentPageResponse response = new DocumentPageResponse(
                docs,
                new DocumentPageResponse.PageMeta(
                        result.meta().page(),
                        result.meta().pageSize(),
                        result.meta().total(),
                        result.meta().pages()
                )
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<ShareLinkResponse>> enableShare(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        String shareToken = documentService.enableShare(id, ownerId);
        String shareUrl = "/share/" + shareToken;
        ShareLinkResponse response = new ShareLinkResponse(shareToken, shareUrl);
        return ResponseEntity.ok(ApiResponse.success("Đã tạo link chia sẻ", response));
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Void>> disableShare(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        documentService.disableShare(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Đã tắt chia sẻ", null));
    }

    @GetMapping("/share/{token}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getByShareToken(
            @PathVariable String token) {
        DocumentResponse response = documentService.getByShareToken(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private DocumentStatus mapStatusFilter(String status) {
        if (status == null || status.isBlank()) return null;
        return switch (status.toUpperCase()) {
            case "ACTIVE" -> DocumentStatus.READY;
            case "REJECTED" -> DocumentStatus.REJECTED;
            case "DELETED" -> DocumentStatus.SOFT_DELETED;
            default -> null; // PENDING covers all processing states
        };
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long currentUserId = JwtUtils.getUserId(jwt);
        return ResponseEntity.ok(ApiResponse.success(documentService.getById(id, currentUserId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        DocumentResponse response = documentService.update(id, request, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tài liệu thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        documentService.delete(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu thành công", null));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        documentService.restore(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Khôi phục tài liệu thành công", null));
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<ApiResponse<Void>> hardDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        documentService.hardDelete(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa vĩnh viễn tài liệu thành công", null));
    }

    @PostMapping("/{id}/reindex")
    public ResponseEntity<ApiResponse<Void>> reindex(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        documentService.reindex(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu reindex đã được gửi", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        documentService.approve(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Duyệt tài liệu thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long id,
            @Valid @RequestBody com.example.historyrag.feature.document.dto.RejectDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        documentService.reject(id, request.rejectionReason(), userId);
        return ResponseEntity.ok(ApiResponse.success("Từ chối tài liệu thành công", null));
    }
}
