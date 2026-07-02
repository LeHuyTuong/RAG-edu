package com.example.historyrag.feature.folder;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.folder.dto.FolderResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FolderServiceImpl implements FolderService {

    private final FolderRepository folderRepository;
    // @Lazy phá circular: DocumentServiceImpl → FolderService → DocumentService
    private final DocumentService documentService;

    public FolderServiceImpl(FolderRepository folderRepository, @Lazy DocumentService documentService) {
        this.folderRepository = folderRepository;
        this.documentService = documentService;
    }

    @Override
    @Transactional
    public FolderResponse create(String folderName, Long ownerId) {
        Folder folder = new Folder();
        folder.setFolderName(folderName);
        folder.setOwnerId(ownerId);
        return FolderResponse.fromEntity(folderRepository.save(folder));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FolderResponse> listByOwner(Long ownerId) {
        return folderRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(folder -> {
                    long docCount = documentService.countActiveByFolderId(folder.getId());
                    return FolderResponse.fromEntity(folder, docCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FolderResponse rename(Long id, String folderName, Long ownerId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", id));

        if (!folder.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Folder", "id", id);
        }

        folder.setFolderName(folderName);
        return FolderResponse.fromEntity(folderRepository.save(folder));
    }

    @Override
    @Transactional
    public void delete(Long id, Long ownerId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", id));

        if (!folder.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Folder", "id", id);
        }

        folderRepository.delete(folder);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByIdAndOwner(Long id, Long ownerId) {
        return folderRepository.existsByIdAndOwnerId(id, ownerId);
    }

    @Override
    @Transactional
    public String enableShare(Long id, Long ownerId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", id));

        if (!folder.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Folder", "id", id);
        }

        if (folder.getShareToken() == null) {
            folder.setShareToken(UUID.randomUUID().toString());
        }
        folder.setShareEnabled(true);
        folderRepository.save(folder);
        return folder.getShareToken();
    }

    @Override
    @Transactional
    public void disableShare(Long id, Long ownerId) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "id", id));

        if (!folder.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Folder", "id", id);
        }

        folder.setShareEnabled(false);
        folderRepository.save(folder);
    }

    @Override
    @Transactional(readOnly = true)
    public FolderResponse getByShareToken(String token) {
        Folder folder = folderRepository.findByShareTokenAndShareEnabledTrue(token)
                .orElseThrow(() -> new ResourceNotFoundException("Folder", "shareToken", token));
        long docCount = documentService.countActiveByFolderId(folder.getId());
        return FolderResponse.fromEntity(folder, docCount);
    }
}
