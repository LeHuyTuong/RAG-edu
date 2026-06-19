package com.example.historyrag.feature.folder;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.folder.dto.FolderResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/folders")
public class FolderController {

    private final FolderService folderService;

    public FolderController(FolderService folderService) {
        this.folderService = folderService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> create(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        FolderResponse response = folderService.create(body.get("folderName"), ownerId);
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
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {
        Long ownerId = jwt.getClaim("userId");
        FolderResponse response = folderService.rename(id, body.get("folderName"), ownerId);
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
}
