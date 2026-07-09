package com.example.historyrag.feature.setting.dto;

import com.example.historyrag.feature.setting.SettingDefaults;
import java.util.Map;

public record SettingResponse(
        String allowedTypes,
        String maxSizeMb,
        String autoApproveCron
) {
    public static SettingResponse fromMap(Map<String, String> settings) {
        return new SettingResponse(
                settings.getOrDefault("upload.allowed_types", SettingDefaults.ALLOWED_UPLOAD_TYPES),
                settings.getOrDefault("upload.max_size_mb", String.valueOf(SettingDefaults.MAX_UPLOAD_SIZE_MB)),
                settings.getOrDefault("auto.approve_cron", "0 * * * * *")
        );
    }
}
