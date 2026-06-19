package com.example.historyrag.feature.config;

import com.example.historyrag.dto.ApiResponse;
import com.example.historyrag.feature.config.dto.ConfigResponse;
import com.example.historyrag.feature.config.dto.ConfigUpdateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/config")
@PreAuthorize("hasRole('ADMIN')")
public class ConfigController {

    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ConfigResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(configService.getConfig()));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<ConfigResponse>> updateConfig(
            @RequestBody ConfigUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình thành công",
                configService.updateConfig(request)));
    }
}
