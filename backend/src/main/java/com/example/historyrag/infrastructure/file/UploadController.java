package com.example.historyrag.infrastructure.file;

import com.example.historyrag.shared.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/upload")
public class UploadController {

    private final FileStorageService fileStorageService;

    public UploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
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
