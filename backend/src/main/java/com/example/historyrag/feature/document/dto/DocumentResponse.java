package com.example.historyrag.feature.document.dto;

import com.example.historyrag.feature.document.Document;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.user.User;

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
        String status,
        DocumentStatus ragStatus,
        Long folderId,
        Long ownerId,
        Boolean isPublic,
        Integer pageCount,
        Integer chunkCount,
        String rejectionReason,
        Long reviewedById,
        Instant reviewedAt,
        AuthorDto author,
        SubjectDto subject,
        Instant uploadedAt,
        Instant createdAt,
        Instant updatedAt,
        String shareToken,
        Boolean shareEnabled
) {
    private static String computeStatus(DocumentStatus status) {
        if (status == null) return "PENDING";
        return switch (status) {
            case READY -> "ACTIVE";
            case REJECTED -> "REJECTED";
            case SOFT_DELETED -> "DELETED";
            default -> "PENDING"; // UPLOADING, REVIEWING, INDEXING, REINDEXING, FAILED
        };
    }

    public static DocumentResponse fromEntity(Document doc, User author, SubjectDto subject) {
        return new DocumentResponse(
                doc.getId(),
                doc.getTitle(),
                doc.getDescription(),
                doc.getFileUrl(),
                doc.getPublicId(),
                doc.getSizeInBytes(),
                doc.getFormat(),
                doc.getResourceType(),
                computeStatus(doc.getStatus()),
                doc.getStatus(),
                doc.getFolderId(),
                doc.getOwnerId(),
                doc.getIsPublic(),
                doc.getPageCount(),
                doc.getChunkCount(),
                doc.getReviewReason(),
                doc.getReviewedById(),
                doc.getReviewedAt(),
                AuthorDto.fromUser(author),
                subject,
                doc.getUploadedAt(),
                doc.getCreatedAt(),
                doc.getUpdatedAt(),
                doc.getShareToken(),
                doc.getShareEnabled()
        );
    }
}
