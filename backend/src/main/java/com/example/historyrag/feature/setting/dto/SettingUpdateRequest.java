package com.example.historyrag.feature.setting.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SettingUpdateRequest(
        @Size(max = 255, message = "Allowed types must not exceed 255 characters")
        @Pattern(
                regexp = "^\\s*[A-Za-z0-9]+(\\s*,\\s*[A-Za-z0-9]+)*\\s*$",
                message = "Allowed types must be a comma-separated extension list")
        String allowedTypes,

        @Min(value = 1, message = "Max size must be at least 1 MB")
        @Max(value = 100, message = "Max size must not exceed 100 MB")
        Integer maxSizeMb,

        @Size(max = 100, message = "Cron expression must not exceed 100 characters")
        String autoApproveCron,

        String geminiApiKeys,
        String cerebrasApiKey,
        String activeLlmProvider
) {}
