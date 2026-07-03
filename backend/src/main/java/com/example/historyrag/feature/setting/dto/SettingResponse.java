package com.example.historyrag.feature.setting.dto;

import java.util.Map;

public record SettingResponse(
        String allowedTypes,
        String maxSizeMb,
        String autoApproveCron
) {
    public static SettingResponse fromMap(Map<String, String> settings) {
        return new SettingResponse(
                settings.getOrDefault("upload.allowed_types", "pdf,docx,txt,md"),
                settings.getOrDefault("upload.max_size_mb", "20"),
                settings.getOrDefault("auto.approve_cron", "0 * * * * *")
        );
    }
}
