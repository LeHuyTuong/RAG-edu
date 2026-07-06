package com.example.historyrag.feature.folder;

import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.shared.JwtUtils;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.billing.BillingService;
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
    private final BillingService billingService;

    public FolderController(FolderService folderService, RagService ragService, BillingService billingService) {
        this.folderService = folderService;
        this.ragService = ragService;
        this.billingService = billingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> create(
            @Valid @RequestBody FolderRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        FolderResponse response = folderService.create(request.folderName(), ownerId);
        return ResponseEntity.ok(ApiResponse.success("Tạo folder thành công", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FolderResponse>>> list(
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        return ResponseEntity.ok(ApiResponse.success(folderService.listByOwner(ownerId)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> rename(
            @PathVariable Long id,
            @Valid @RequestBody FolderRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        FolderResponse response = folderService.rename(id, request.folderName(), ownerId);
        return ResponseEntity.ok(ApiResponse.success("Đổi tên folder thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        folderService.delete(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Xóa folder thành công", null));
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<ApiResponse<RagChatResponse>> chat(
            @PathVariable Long id,
            @Valid @RequestBody FolderChatRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        Long userId = JwtUtils.getUserId(jwt);
        // Verify folder belongs to this user
        if (!folderService.existsByIdAndOwner(id, userId)) {
            throw new ResourceNotFoundException("Folder", "id", id);
        }
        billingService.consumeChatCredit(userId, "Folder chat");
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

    @PostMapping("/{id}/share")
    public ResponseEntity<ApiResponse<String>> enableShare(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        String token = folderService.enableShare(id, ownerId);
        String shareUrl = "/share/notebook/" + token;
        return ResponseEntity.ok(ApiResponse.success("Đã tạo link chia sẻ", shareUrl));
    }

    @DeleteMapping("/{id}/share")
    public ResponseEntity<ApiResponse<Void>> disableShare(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = JwtUtils.getUserId(jwt);
        folderService.disableShare(id, ownerId);
        return ResponseEntity.ok(ApiResponse.success("Đã tắt chia sẻ", null));
    }

    // --- Public shared folder endpoints (no JWT required, whitelisted in SecurityConfig) ---

    @GetMapping("/shared/{token}")
    public ResponseEntity<ApiResponse<FolderResponse>> getSharedFolder(
            @PathVariable String token) {
        FolderResponse response = folderService.getByShareToken(token);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/shared/{token}/chat")
    public ResponseEntity<ApiResponse<RagChatResponse>> sharedChat(
            @PathVariable String token,
            @Valid @RequestBody FolderChatRequest request) {
        // Look up folder by share token (no JWT)
        FolderResponse folder = folderService.getByShareToken(token);
        RagChatRequest ragRequest = new RagChatRequest(
                request.question(),
                request.topK(),
                false,
                java.util.List.of(),
                java.util.List.of(),
                request.temperature(),
                folder.id(),
                null  // No userId for shared/public chat
        );
        RagChatResponse response = ragService.chat(ragRequest, null);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
