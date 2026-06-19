package com.example.historyrag.feature.config.dto;

import java.util.Map;

public record ConfigResponse(
        String allowedTypes,
        String maxSizeMb
) {
    public static ConfigResponse fromMap(Map<String, String> settings) {
        return new ConfigResponse(
                settings.getOrDefault("upload.allowed_types", "pdf,docx,txt,md"),
                settings.getOrDefault("upload.max_size_mb", "20")
        );
    }
}
