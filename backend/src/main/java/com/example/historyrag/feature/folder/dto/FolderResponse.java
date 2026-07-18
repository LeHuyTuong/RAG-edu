package com.example.historyrag.feature.folder.dto;

import com.example.historyrag.feature.folder.Folder;

import java.time.Instant;

public record FolderResponse(
        Long id,
        String folderName,
        Long ownerId,
        long documentCount,
        Instant createdAt,
        Instant updatedAt,
        String shareToken,
        Boolean shareEnabled
) {
    public static FolderResponse fromEntity(Folder folder) {
        return new FolderResponse(
                folder.getId(),
                folder.getFolderName(),
                folder.getOwnerId(),
                0L,
                folder.getCreatedAt(),
                folder.getUpdatedAt(),
                folder.getShareToken(),
                folder.getShareEnabled()
        );
    }

    public static FolderResponse fromEntity(Folder folder, long documentCount) {
        return new FolderResponse(
                folder.getId(),
                folder.getFolderName(),
                folder.getOwnerId(),
                documentCount,
                folder.getCreatedAt(),
                folder.getUpdatedAt(),
                folder.getShareToken(),
                folder.getShareEnabled()
        );
    }
}
