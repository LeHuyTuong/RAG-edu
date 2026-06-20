package com.example.historyrag.feature.document;

import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {

    DocumentResponse create(MultipartFile file, CreateDocumentRequest request, Long ownerId);

    DocumentResponse update(Long id, UpdateDocumentRequest request, Long ownerId);

    DocumentResponse getById(Long id, Long currentUserId);

    List<DocumentResponse> getMyDocuments(Long ownerId);

    ResultPaginationDTO filter(String search, Long folderId, DocumentStatus status,
                               Long ownerId, Boolean onlyMine, Pageable pageable);

    void delete(Long id, Long ownerId);

    void restore(Long id, Long ownerId);

    void hardDelete(Long id, Long ownerId);

    void reindex(Long id, Long ownerId);

    long countAll();

    long countByStatus(DocumentStatus status);

    long countActiveByFolderId(Long folderId);
}
