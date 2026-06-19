package com.example.historyrag.feature.document.dto;

import com.example.historyrag.feature.document.Document;
import com.example.historyrag.feature.document.DocumentStatus;

import java.time.Instant;

public record DocumentResponse(
        Long id,
        String title,
        String description,
        String fileUrl,
        String publicId,
        Long sizeInBytes,
        String format,
        String resourceType,
        DocumentStatus status,
        Long folderId,
        Long ownerId,
        Boolean isPublic,
        Integer pageCount,
        Integer chunkCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static DocumentResponse fromEntity(Document doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getTitle(),
                doc.getDescription(),
                doc.getFileUrl(),
                doc.getPublicId(),
                doc.getSizeInBytes(),
                doc.getFormat(),
                doc.getResourceType(),
                doc.getStatus(),
                doc.getFolderId(),
                doc.getOwnerId(),
                doc.getIsPublic(),
                doc.getPageCount(),
                doc.getChunkCount(),
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }
}
