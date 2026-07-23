package com.example.historyrag.feature.admin.setting;

import com.example.historyrag.shared.ApiResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system-settings")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SystemSetting>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.success(systemSettingService.getAllSettings()));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ApiResponse<SystemSetting>> updateSetting(
            @PathVariable String key,
            @RequestBody UpdateSettingRequest request) {
        SystemSetting updated = systemSettingService.updateSetting(key, request.value());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cài đặt thành công", updated));
    }

    public record UpdateSettingRequest(String value) {}
}
