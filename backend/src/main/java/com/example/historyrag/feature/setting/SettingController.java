package com.example.historyrag.feature.setting;

import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.setting.dto.SettingUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/config")
@PreAuthorize("hasRole('ADMIN')")
public class SettingController {

    private final SettingService configService;

    public SettingController(SettingService configService) {
        this.configService = configService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SettingResponse>> getConfig() {
        return ResponseEntity.ok(ApiResponse.success(configService.getConfig()));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<SettingResponse>> updateConfig(
            @Valid @RequestBody SettingUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cấu hình thành công",
                configService.updateConfig(request)));
    }
}
