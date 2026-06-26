package com.example.historyrag.feature.folder;

import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.folder.dto.FolderChatRequest;
import com.example.historyrag.feature.folder.dto.FolderRequest;
import com.example.historyrag.feature.folder.dto.FolderResponse;
import com.example.historyrag.feature.rag.RagService;
import com.example.historyrag.infrastructure.webclient.dto.RagChatRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagChatResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/folders")
public class FolderController {

    private final FolderService folderService;
    private final RagService ragService;

    public FolderController(FolderService folderService, RagService ragService) {
        this.folderService = folderService;
        this.ragService = ragService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> create(
            @Valid @RequestBody FolderRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        FolderResponse response = folderService.create(request.folderName(), ownerId);
        return ResponseEntity.ok(ApiResponse.success("Tạo folder thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FolderResponse>>> list(
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        return ResponseEntity.ok(ApiResponse.success(folderService.listByOwner(ownerId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> rename(
            @PathVariable Long id,
            @Valid @RequestBody FolderRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        FolderResponse response = folderService.rename(id, request.folderName(), ownerId);
        return ResponseEntity.ok(ApiResponse.success("Đổi tên folder thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        folderService.delete(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa folder thành công", null));
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<ApiResponse<RagChatResponse>> chat(
            @PathVariable Long id,
            @Valid @RequestBody FolderChatRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = jwt.getClaim("userId");
        // Verify folder belongs to this user
        if (!folderService.existsByIdAndOwner(id, userId)) {
            throw new ResourceNotFoundException("Folder", "id", id);
        }
        RagChatRequest ragRequest = new RagChatRequest(
                request.question(),
                request.topK(),
                false,
                java.util.List.of(),
                java.util.List.of(),
                request.temperature(),
                id,
                userId
        );
        RagChatResponse response = ragService.chat(ragRequest, null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
