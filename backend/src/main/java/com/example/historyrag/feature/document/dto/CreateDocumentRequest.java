package com.example.historyrag.feature.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Nhận qua JSON body sau khi file đã upload lên Cloudinary.
 */
public record CreateDocumentRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500)
        String title,

        @Size(max = 5000)
        String description,

        @NotBlank(message = "fileUrl is required")
        String fileUrl,

        @NotBlank(message = "publicId is required")
        String publicId,

        @NotNull(message = "sizeInBytes is required")
        Long sizeInBytes,

        @NotBlank(message = "format is required")
        String format,

        @NotBlank(message = "resourceType is required")
        String resourceType,

        Long subjectId,

        Boolean isPublic,

        Long folderId
) {
    public CreateDocumentRequest {
        isPublic = isPublic != null && isPublic;
    }
}
