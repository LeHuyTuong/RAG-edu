package com.example.historyrag.feature.document;

import com.example.historyrag.feature.audit.DownloadAuditService;
import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.shared.JwtUtils;
import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentPageResponse;
import com.example.historyrag.feature.document.dto.DocumentDownload;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.ShareLinkResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;
    private final DownloadAuditService downloadAuditService;

    public DocumentController(DocumentService documentService,
                              DownloadAuditService downloadAuditService) {
        this.documentService = documentService;
        this.downloadAuditService = downloadAuditService;
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
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean onlyMine,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "12") int limit,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        DocumentStatus mappedStatus = mapStatusFilter(status);
        ResultPaginationDTO result = documentService.filter(
                search, folderId, subjectId, mappedStatus, ownerId, onlyMine,
                newestFirstPageRequest(page, limit));
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
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        DocumentStatus mappedStatus = mapStatusFilter(status);
        ResultPaginationDTO result = documentService.filter(
                null, null, subjectId, mappedStatus, ownerId, true,
                newestFirstPageRequest(page, limit));
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
        String value = status.trim().toUpperCase();
        // Alias tương thích ngược với chuỗi collapsed cũ của frontend.
        switch (value) {
            case "ACTIVE" -> { return DocumentStatus.READY; }
            case "PENDING" -> { return DocumentStatus.PENDING_REVIEW; }
            case "DELETED" -> { return DocumentStatus.SOFT_DELETED; }
            default -> { /* rơi xuống parse trực tiếp theo tên enum */ }
        }
        // Cho phép lọc theo đúng từng state của UML state machine:
        // UPLOADING, REVIEWING, PENDING_REVIEW, INDEXING, REINDEXING, READY, FAILED, REJECTED, SOFT_DELETED.
        try {
            return DocumentStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            return null; // giá trị không hợp lệ -> không áp filter thay vì trả sai
        }
    }

    private PageRequest newestFirstPageRequest(int page, int limit) {
        Sort newestFirst = Sort.by(
                Sort.Order.desc("uploadedAt"),
                Sort.Order.desc("createdAt"),
                Sort.Order.desc("id")
        );
        return PageRequest.of(page - 1, limit, newestFirst);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long currentUserId = JwtUtils.getUserId(jwt);
        return ResponseEntity.ok(ApiResponse.success(documentService.getById(id, currentUserId, isAdmin(jwt))));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        DocumentDownload download = documentService.prepareDownload(
                id,
                JwtUtils.getUserId(jwt),
                jwt.getSubject(),
                isAdmin(jwt));
        downloadAuditService.record(
                id,
                JwtUtils.getUserId(jwt),
                jwt.getSubject(),
                download.watermarked(),
                request.getRemoteAddr());
        String encodedFilename = URLEncoder.encode(download.filename(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedFilename)
                .header("X-RAG-Edu-Watermarked", Boolean.toString(download.watermarked()))
                .body(download.content());
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> file(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletRequest request) {
        DocumentDownload download = documentService.prepareDownload(
                id,
                JwtUtils.getUserId(jwt),
                jwt.getSubject(),
                isAdmin(jwt));
        downloadAuditService.record(
                id,
                JwtUtils.getUserId(jwt),
                jwt.getSubject(),
                download.watermarked(),
                request.getRemoteAddr());
        String encodedFilename = URLEncoder.encode(download.filename(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(download.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedFilename)
                .header("X-RAG-Edu-Watermarked", Boolean.toString(download.watermarked()))
                .body(download.content());
    }

    private boolean isAdmin(Jwt jwt) {
        if ("ADMIN".equalsIgnoreCase(jwt.getClaimAsString("accountType"))) {
            return true;
        }
        List<String> roles = jwt.getClaimAsStringList("roles");
        return roles != null && roles.contains("ROLE_ADMIN");
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
        Long userId = JwtUtils.getUserId(jwt);
        documentService.delete(id, userId, isAdmin(jwt));
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu thành công", null));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restore(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        documentService.restore(id, userId, isAdmin(jwt));
        return ResponseEntity.ok(ApiResponse.success("Khôi phục tài liệu thành công", null));
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<ApiResponse<Void>> hardDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        documentService.hardDelete(id, userId, isAdmin(jwt));
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

    @PostMapping("/{id}/reclassify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> reclassify(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        documentService.reclassify(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã gửi yêu cầu phân loại lại", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentResponse>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        DocumentResponse response = documentService.approve(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Duyệt tài liệu thành công", response));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getPendingReviews() {
        List<DocumentResponse> result = documentService.getPendingReviews();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DocumentResponse>> reject(
            @PathVariable Long id,
            @Valid @RequestBody com.example.historyrag.feature.document.dto.RejectDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        DocumentResponse response = documentService.reject(id, request.rejectionReason(), userId);
        return ResponseEntity.ok(ApiResponse.success("Từ chối tài liệu thành công", response));
    }
}
