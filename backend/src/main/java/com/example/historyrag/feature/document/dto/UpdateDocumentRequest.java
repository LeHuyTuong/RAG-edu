package com.example.historyrag.feature.document.dto;

import jakarta.validation.constraints.Size;

public record UpdateDocumentRequest(
        @Size(max = 500, message = "Title must not exceed 500 characters")
        String title,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        Long folderId,

        Boolean isPublic
) {}
