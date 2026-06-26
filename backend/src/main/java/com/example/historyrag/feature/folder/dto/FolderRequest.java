package com.example.historyrag.feature.folder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FolderRequest(
        @NotBlank(message = "Folder name is required")
        @Size(max = 255, message = "Folder name must not exceed 255 characters")
        String folderName
) {
}
