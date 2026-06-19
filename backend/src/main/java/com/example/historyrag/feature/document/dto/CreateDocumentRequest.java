package com.example.historyrag.feature.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500, message = "Title must not exceed 500 characters")
        String title,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        @NotBlank(message = "fileUrl is required")
        String fileUrl,

        @NotBlank(message = "publicId is required")
        String publicId,

        Long sizeInBytes,

        @NotBlank(message = "Format is required")
        String format,

        String resourceType,

        Long folderId,

        Boolean isPublic
) {
    public CreateDocumentRequest {
        resourceType = resourceType != null ? resourceType : "raw";
        isPublic = isPublic != null && isPublic;
    }
}
