package com.example.historyrag.feature.setting.dto;

public record SettingUpdateRequest(
        String allowedTypes,
        String maxSizeMb
) {}
