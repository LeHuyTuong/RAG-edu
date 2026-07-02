package com.example.historyrag.infrastructure.file;

import com.example.historyrag.feature.setting.SettingService;
import com.example.historyrag.shared.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {

    private final FileStorageService fileStorageService;
    private final SettingService settingService;

    public UploadController(FileStorageService fileStorageService, SettingService settingService) {
        this.fileStorageService = fileStorageService;
        this.settingService = settingService;
    }

    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUploadConfig() {
        var config = settingService.getConfig();
        int maxSizeMb;
        try {
            maxSizeMb = Integer.parseInt(config.maxSizeMb());
        } catch (NumberFormatException e) {
            maxSizeMb = 20;
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "maxFileSize", maxSizeMb * 1024 * 1024,
                "maxSizeMb", maxSizeMb,
                "allowedTypes", config.allowedTypes()
        )));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        StoredFile stored = fileStorageService.store(file);

        String baseUrl = request.getScheme() + "://" +
                request.getServerName() + ":" +
                request.getServerPort();
        String fileUrl = baseUrl + "/uploads/" + stored.storedName();

        Map<String, Object> result = Map.of(
                "storedName", stored.storedName(),
                "fileUrl", fileUrl,
                "sizeInBytes", stored.sizeInBytes(),
                "format", stored.format(),
                "resourceType", "local"
        );

        return ResponseEntity.ok(ApiResponse.success("Upload thành công", result));
    }
}
