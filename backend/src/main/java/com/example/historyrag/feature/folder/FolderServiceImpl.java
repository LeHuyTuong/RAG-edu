package com.example.historyrag.feature.folder;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.document.DocumentRepository;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.folder.dto.FolderResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FolderServiceImpl implements FolderService {

    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;

    public FolderServiceImpl(FolderRepository folderRepository, DocumentRepository documentRepository) {
        this.folderRepository = folderRepository;
        this.documentRepository = documentRepository;
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
                    long docCount = documentRepository.countByFolderIdAndStatusNot(
                            folder.getId(), DocumentStatus.SOFT_DELETED);
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
}
