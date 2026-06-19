package com.example.historyrag.feature.document;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
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
        Long ownerId = jwt.getClaim("userId");
        DocumentResponse response = documentService.create(request, ownerId);
        URI location = URI.create("/api/v1/documents/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo tài liệu thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ResultPaginationDTO>> filter(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) DocumentStatus status,
            @RequestParam(defaultValue = "false") boolean onlyMine,
            @ParameterObject Pageable pageable,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        ResultPaginationDTO result = documentService.filter(
                search, folderId, status, ownerId, onlyMine, pageable);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getMyDocuments(
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        return ResponseEntity.ok(ApiResponse.success(documentService.getMyDocuments(ownerId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long currentUserId = jwt.getClaim("userId");
        return ResponseEntity.ok(ApiResponse.success(documentService.getById(id, currentUserId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        DocumentResponse response = documentService.update(id, request, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tài liệu thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        documentService.delete(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu thành công", null));
    }

    @PostMapping("/{id}/reindex")
    public ResponseEntity<ApiResponse<Void>> reindex(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        documentService.reindex(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Yêu cầu reindex đã được gửi", null));
    }
}
