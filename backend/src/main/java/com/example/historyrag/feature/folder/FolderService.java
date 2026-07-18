package com.example.historyrag.feature.folder;

import com.example.historyrag.feature.folder.dto.FolderResponse;

import java.util.List;

public interface FolderService {

    FolderResponse create(String folderName, Long ownerId);

    List<FolderResponse> listByOwner(Long ownerId);

    FolderResponse rename(Long id, String folderName, Long ownerId);

    void delete(Long id, Long ownerId);

    boolean existsByIdAndOwner(Long id, Long ownerId);

    String enableShare(Long id, Long ownerId);

    void disableShare(Long id, Long ownerId);

    FolderResponse getByShareToken(String token);
}
