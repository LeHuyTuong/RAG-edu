package com.example.historyrag.feature.document;

import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.SubjectDto;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.folder.FolderService;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.user.UserService;
import com.example.historyrag.feature.user.dto.AccountResponse;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final FolderService folderService;
    private final UserService userService;
    private final SubjectService subjectService;
    private final RagClientService ragClientService;
    private final FileStorageService fileStorageService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public DocumentResponse create(CreateDocumentRequest request, Long ownerId) {
        if (request.folderId() != null) {
            if (!folderService.existsByIdAndOwner(request.folderId(), ownerId)) {
                throw new ResourceNotFoundException("Folder", "id", request.folderId());
            }
        }

        Document document = new Document();
        document.setTitle(request.title());
        document.setDescription(request.description());
        document.setFileUrl(request.fileUrl());
        document.setPublicId(request.publicId());
        document.setSizeInBytes(request.sizeInBytes());
        document.setFormat(request.format());
        document.setResourceType(request.resourceType());
        document.setSubjectId(request.subjectId());
        document.setStatus(DocumentStatus.UPLOADING);
        document.setFolderId(request.folderId());
        document.setOwnerId(ownerId);
        document.setIsPublic(request.isPublic());
        document.setUploadedAt(Instant.now());

        Document saved = documentRepository.saveAndFlush(document);
        eventPublisher.publishEvent(new DocumentIngestRequested(saved.getId()));

        SubjectDto subject = buildSubjectDto(request.subjectId());
        AccountResponse author = userService.findById(ownerId).orElse(null);

        log.info("Document created: id={}, cloudinary={}, status=UPLOADING", saved.getId(), request.publicId());
        return DocumentResponse.fromEntity(saved, toUserEntity(author), subject);
    }

    @Override
    @Transactional
    public DocumentResponse update(Long id, UpdateDocumentRequest request, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        if (request.title() != null) {
            doc.setTitle(request.title());
        }
        if (request.description() != null) {
            doc.setDescription(request.description());
        }
        if (request.folderId() != null) {
            if (!folderService.existsByIdAndOwner(request.folderId(), ownerId)) {
                throw new ResourceNotFoundException("Folder", "id", request.folderId());
            }
            doc.setFolderId(request.folderId());
        }
        if (request.subjectId() != null) {
            doc.setSubjectId(request.subjectId());
        }
        if (request.isPublic() != null) {
            doc.setIsPublic(request.isPublic());
        }

        AccountResponse author = userService.findById(doc.getOwnerId()).orElse(null);
        SubjectDto subject = buildSubjectDto(doc.getSubjectId());
        return DocumentResponse.fromEntity(documentRepository.save(doc), toUserEntity(author), subject);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getById(Long id, Long currentUserId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        // Only owner or public READY documents are visible
        if (!doc.getOwnerId().equals(currentUserId)) {
            if (!Boolean.TRUE.equals(doc.getIsPublic()) || doc.getStatus() != DocumentStatus.READY) {
                throw new ResourceNotFoundException("Document", "id", id);
            }
        }

        AccountResponse author = userService.findById(doc.getOwnerId()).orElse(null);
        SubjectDto subject = buildSubjectDto(doc.getSubjectId());
        return DocumentResponse.fromEntity(doc, toUserEntity(author), subject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getMyDocuments(Long ownerId) {
        AccountResponse author = userService.findById(ownerId).orElse(null);
        com.example.historyrag.feature.user.User authorEntity = toUserEntity(author);
        return documentRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .filter(doc -> doc.getStatus() != DocumentStatus.SOFT_DELETED)
                .map(doc -> {
                    SubjectDto subject = buildSubjectDto(doc.getSubjectId());
                    return DocumentResponse.fromEntity(doc, authorEntity, subject);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(String search, Long folderId, DocumentStatus status,
                                       Long ownerId, Boolean onlyMine, Pageable pageable) {
        PredicateSpecification<Document> spec = DocumentSpecification.build(
                search, folderId, status, Boolean.TRUE.equals(onlyMine) ? ownerId : null);

        Page<DocumentResponse> pageResult = documentRepository.findBy(spec, q -> q.page(pageable))
                .map(doc -> {
                    AccountResponse author = userService.findById(doc.getOwnerId()).orElse(null);
                    SubjectDto subject = buildSubjectDto(doc.getSubjectId());
                    return DocumentResponse.fromEntity(doc, toUserEntity(author), subject);
                });
        return ResultPaginationDTO.fromPage(pageResult);
    }

    @Override
    @Transactional
    public void delete(Long id, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        doc.setStatus(DocumentStatus.SOFT_DELETED);
        documentRepository.save(doc);

        // Delete vectors from Qdrant
        try {
            ragClientService.deleteSource(id, null);
        } catch (Exception e) {
            log.warn("Failed to delete vectors for document {}: {}", id, e.getMessage());
        }
    }

    @Override
    @Transactional
    public void reindex(Long id, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        if (doc.getStatus() != DocumentStatus.FAILED
                && doc.getStatus() != DocumentStatus.READY
                && doc.getStatus() != DocumentStatus.REJECTED) {
            throw new InvalidRequestException("Chỉ có thể reindex tài liệu ở trạng thái READY, FAILED hoặc REJECTED");
        }

        doc.setStatus(DocumentStatus.REINDEXING);
        documentRepository.save(doc);
        eventPublisher.publishEvent(new DocumentIngestRequested(doc.getId()));
    }

    @Override
    @Transactional
    public void restore(Long id, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        if (doc.getStatus() != DocumentStatus.SOFT_DELETED) {
            throw new InvalidRequestException("Chỉ có thể khôi phục tài liệu ở trạng thái SOFT_DELETED");
        }

        doc.setStatus(DocumentStatus.READY);
        documentRepository.save(doc);
        log.info("Document {} restored to READY", id);
    }

    @Override
    @Transactional
    public void hardDelete(Long id, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        try {
            ragClientService.deleteSource(id, null);
        } catch (Exception e) {
            log.warn("Failed to delete vectors for document {}: {}", id, e.getMessage());
        }

        documentRepository.delete(doc);
        log.info("Document {} hard deleted (vectors + db)", id);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAll() {
        return documentRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(DocumentStatus status) {
        return documentRepository.countByStatus(status);
    }

    @Override
    @Transactional
    public void approve(Long id, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        doc.setStatus(DocumentStatus.READY);
        doc.setIsPublic(true);
        doc.setReviewedById(userId);
        doc.setReviewedAt(Instant.now());
        documentRepository.save(doc);
        log.info("Document {} approved by userId={}", id, userId);
    }

    @Override
    @Transactional
    public void reject(Long id, String reason, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        doc.setStatus(DocumentStatus.REJECTED);
        doc.setReviewReason(reason);
        doc.setReviewedById(userId);
        doc.setReviewedAt(Instant.now());
        documentRepository.save(doc);
        log.info("Document {} rejected by userId={}, reason={}", id, userId, reason);
    }

    @Override
    @Transactional
    public String enableShare(Long id, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        if (doc.getShareToken() == null) {
            doc.setShareToken(UUID.randomUUID().toString());
        }
        doc.setShareEnabled(true);
        documentRepository.save(doc);
        log.info("Share enabled for document {} token={}", id, doc.getShareToken());
        return doc.getShareToken();
    }

    @Override
    @Transactional
    public void disableShare(Long id, Long ownerId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!doc.getOwnerId().equals(ownerId)) {
            throw new ResourceNotFoundException("Document", "id", id);
        }

        doc.setShareEnabled(false);
        documentRepository.save(doc);
        log.info("Share disabled for document {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getByShareToken(String token) {
        Document doc = documentRepository.findByShareTokenAndShareEnabledTrue(token)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "shareToken", token));

        AccountResponse author = userService.findById(doc.getOwnerId()).orElse(null);
        SubjectDto subject = buildSubjectDto(doc.getSubjectId());
        return DocumentResponse.fromEntity(doc, toUserEntity(author), subject);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveByFolderId(Long folderId) {
        return documentRepository.countByFolderIdAndStatusNot(folderId, DocumentStatus.SOFT_DELETED);
    }

    @Override
    @Transactional
    public void purgeExpiredSoftDeleted(Instant cutoff) {
        List<Document> expired = documentRepository
                .findByStatusAndUpdatedAtBefore(DocumentStatus.SOFT_DELETED, cutoff);

        if (expired.isEmpty()) {
            log.debug("Soft-delete cleanup: nothing to purge");
            return;
        }

        log.info("Soft-delete cleanup: purging {} document(s) older than cutoff={}", expired.size(), cutoff);

        for (Document doc : expired) {
            try {
                ragClientService.deleteSource(doc.getId(), null);
            } catch (Exception e) {
                log.warn("Failed to delete Qdrant vectors for doc {}: {}", doc.getId(), e.getMessage());
            }
            fileStorageService.delete(doc.getPublicId());
            documentRepository.delete(doc);
            log.info("Purged document id={} title={}", doc.getId(), doc.getTitle());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByIdAndOwner(Long id, Long ownerId) {
        return documentRepository.existsByIdAndOwnerIdAndStatusNot(id, ownerId, DocumentStatus.SOFT_DELETED);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean allExistByIdsAndOwner(List<Long> ids, Long ownerId) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        List<Long> distinctIds = ids.stream().distinct().toList();
        long ownedCount = documentRepository.countByIdInAndOwnerIdAndStatusNot(
                distinctIds, ownerId, DocumentStatus.SOFT_DELETED);
        return ownedCount == distinctIds.size();
    }

    // --- helpers ---

    private SubjectDto buildSubjectDto(Long subjectId) {
        if (subjectId == null) return null;
        return subjectService.findOptionalById(subjectId)
                .map(s -> new SubjectDto(s.id(), s.name(), s.code()))
                .orElse(null);
    }

    private com.example.historyrag.feature.user.User toUserEntity(AccountResponse dto) {
        if (dto == null) return null;
        com.example.historyrag.feature.user.User user = new com.example.historyrag.feature.user.User();
        user.setId(dto.id());
        user.setFullName(dto.name());
        user.setAvatarUrl(dto.avatarUrl());
        return user;
    }
}