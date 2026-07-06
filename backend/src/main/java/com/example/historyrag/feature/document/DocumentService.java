package com.example.historyrag.feature.document;

import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.DocumentDownload;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;

public interface DocumentService {

    DocumentResponse create(CreateDocumentRequest request, Long ownerId);

    DocumentResponse update(Long id, UpdateDocumentRequest request, Long ownerId);

    DocumentResponse getById(Long id, Long currentUserId, boolean canViewAnyDocument);

    DocumentDownload prepareDownload(Long id, Long currentUserId, String currentUserEmail, boolean canViewAnyDocument);

    List<DocumentResponse> getMyDocuments(Long ownerId);

    List<DocumentResponse> getPendingReviews();

    ResultPaginationDTO filter(String search, Long folderId, Long subjectId, DocumentStatus status,
                               Long ownerId, Boolean onlyMine, Pageable pageable);

    void delete(Long id, Long ownerId);

    void restore(Long id, Long ownerId);

    void hardDelete(Long id, Long ownerId);

    void reindex(Long id, Long ownerId);

    DocumentResponse approve(Long id, Long userId);

    void triggerIngest(Long id, Long userId);

    void processAutoApprovedDocuments();

    void reclassify(Long id, Long userId);

    DocumentResponse reject(Long id, String reason, Long userId);

    long countAll();

    long countByStatus(DocumentStatus status);

    long countActiveByFolderId(Long folderId);

    void purgeExpiredSoftDeleted(Instant cutoff);

    boolean existsByIdAndOwner(Long id, Long ownerId);

    boolean allExistByIds(List<Long> ids);

    boolean allExistByIdsAndOwner(List<Long> ids, Long ownerId);

    boolean allValidByIdsAndOwner(List<Long> ids, Long ownerId);

    boolean allReadyForAiByIds(List<Long> ids);

    boolean allReadyForAiByIdsAndOwner(List<Long> ids, Long ownerId);

    String enableShare(Long id, Long ownerId);

    void disableShare(Long id, Long ownerId);

    DocumentResponse getByShareToken(String token);
}
