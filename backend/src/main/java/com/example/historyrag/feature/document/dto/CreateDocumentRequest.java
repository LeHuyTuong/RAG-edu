package com.example.historyrag.feature.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Nhận qua @RequestPart("data") khi upload multipart.
 * File PDF đi kèm qua @RequestPart("file").
 */
public record CreateDocumentRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 500)
        String title,

        @Size(max = 5000)
        String description,

        Long folderId,

        Boolean isPublic
) {
    public CreateDocumentRequest {
        isPublic = isPublic != null && isPublic;
    }
}
