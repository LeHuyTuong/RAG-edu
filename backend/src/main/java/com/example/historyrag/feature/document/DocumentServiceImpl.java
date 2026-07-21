package com.example.historyrag.feature.document;

import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentDownload;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.SubjectDto;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.document.chunk.DocumentChunk;
import com.example.historyrag.feature.document.chunk.DocumentChunkService;
import com.example.historyrag.feature.folder.FolderService;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.user.UserService;
import com.example.historyrag.feature.user.dto.AccountResponse;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.file.PdfWatermarkService;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestMetadata;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.nio.file.Files;
import java.nio.file.Path;
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
    private final DocumentChunkService documentChunkService;
    private final PdfWatermarkService pdfWatermarkService;
    private final com.example.historyrag.feature.billing.BillingService billingService;
    private final ContentHashLockRegistry contentHashLockRegistry;

    @Override
    @Transactional
    public DocumentResponse create(CreateDocumentRequest request, Long ownerId) {
        if (request.folderId() != null) {
            if (!folderService.existsByIdAndOwner(request.folderId(), ownerId)) {
                throw new ResourceNotFoundException("Folder", "id", request.folderId());
            }
        }

        billingService.consumeDocumentQuota(ownerId, "Tải lên tài liệu: " + request.title(), request.sizeInBytes());

        Document document = new Document();
        document.setTitle(request.title());
        document.setDescription(request.description());
        document.setOriginalAuthor(request.originalAuthor());
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
        if (request.originalAuthor() != null) {
            doc.setOriginalAuthor(request.originalAuthor());
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
    public DocumentResponse getById(Long id, Long currentUserId, boolean canViewAnyDocument) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (canViewAnyDocument) {
            if (doc.getStatus() == DocumentStatus.SOFT_DELETED) {
                throw new ResourceNotFoundException("Document", "id", id);
            }
        } else if (!doc.getOwnerId().equals(currentUserId)) {
            // Only owner or public READY documents are visible to normal users.
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
    public DocumentDownload prepareDownload(Long id, Long currentUserId, String currentUserEmail, boolean canViewAnyDocument) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        boolean isOwner = doc.getOwnerId().equals(currentUserId);
        if (!canViewAnyDocument && !isOwner) {
            if (!Boolean.TRUE.equals(doc.getIsPublic()) || doc.getStatus() != DocumentStatus.READY) {
                throw new ResourceNotFoundException("Document", "id", id);
            }
        }

        byte[] content;
        try {
            content = Files.readAllBytes(Path.of(resolveInternalFilePath(doc)));
        } catch (Exception e) {
            throw new InvalidRequestException("Không thể đọc file tài liệu: " + e.getMessage());
        }

        String format = normalizeFormat(doc.getFormat(), doc.getPublicId());
        boolean shouldWatermark = !isOwner && !canViewAnyDocument && Boolean.TRUE.equals(doc.getIsPublic()) && "pdf".equals(format);
        if (shouldWatermark) {
            String ownerName = userService.findById(doc.getOwnerId())
                    .map(AccountResponse::name)
                    .orElse("unknown");
            content = pdfWatermarkService.addPublicDownloadWatermark(
                    content, currentUserEmail, ownerName, doc.getOriginalAuthor(), Instant.now());
        }

        return new DocumentDownload(
                content,
                buildDownloadFilename(doc, shouldWatermark, format),
                contentType(format),
                shouldWatermark);
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
    public List<DocumentResponse> getPendingReviews() {
        return documentRepository.findByStatus(DocumentStatus.PENDING_REVIEW).stream()
                .map(doc -> {
                    AccountResponse author = userService.findById(doc.getOwnerId()).orElse(null);
                    SubjectDto subject = buildSubjectDto(doc.getSubjectId());
                    return DocumentResponse.fromEntity(doc, toUserEntity(author), subject);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(String search, Long folderId, Long subjectId, DocumentStatus status,
                                       Long ownerId, Boolean onlyMine, Pageable pageable) {
        PredicateSpecification<Document> spec = DocumentSpecification.build(
                search, folderId, subjectId, status, Boolean.TRUE.equals(onlyMine) ? ownerId : null);

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
    public void delete(Long id, Long currentUserId, boolean isAdmin) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!isAdmin && !doc.getOwnerId().equals(currentUserId)) {
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
                && doc.getStatus() != DocumentStatus.READY) {
            throw new InvalidRequestException("Chỉ có thể reindex tài liệu ở trạng thái READY hoặc FAILED");
        }

        doc.setStatus(DocumentStatus.REINDEXING);
        documentRepository.save(doc);
        eventPublisher.publishEvent(new DocumentIngestRequested(doc.getId()));
    }

    @Override
    @Transactional
    public void restore(Long id, Long currentUserId, boolean isAdmin) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!isAdmin && !doc.getOwnerId().equals(currentUserId)) {
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
    public void hardDelete(Long id, Long currentUserId, boolean isAdmin) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (!isAdmin && !doc.getOwnerId().equals(currentUserId)) {
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
    public DocumentResponse approve(Long id, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (doc.getStatus() == DocumentStatus.REJECTED) {
            throw new InvalidRequestException("Tài liệu đã bị từ chối, không thể tự duyệt lại");
        }

        // Manual approval = quyết định kiểm duyệt của admin. Theo UML state machine,
        // duyệt tài liệu chưa index đưa nó vào INDEXING (không set READY lạc quan);
        // DocumentIngestListener sẽ ingest rồi chuyển INDEXING -> READY (thành công)
        // hoặc INDEXING -> FAILED (index lỗi). reviewedAt/reviewedById ghi lại việc
        // đã qua kiểm duyệt, nên ca "đã duyệt nhưng index lỗi" = FAILED + reviewedAt.
        if (doc.getStatus() == DocumentStatus.PENDING_REVIEW || doc.getStatus() == DocumentStatus.FAILED) {
            doc.setStatus(DocumentStatus.INDEXING);
            doc.setIsPublic(true);
            doc.setReviewedById(userId);
            doc.setReviewedAt(Instant.now());
            documentRepository.save(doc);
            eventPublisher.publishEvent(new DocumentIngestRequested(doc.getId()));
            log.info("Document {} manually approved by userId={}, status -> INDEXING", id, userId);
        } else if (doc.getStatus() == DocumentStatus.READY) {
            // Đã index sẵn — chỉ cập nhật quyết định publish, không ingest lại.
            doc.setIsPublic(true);
            doc.setReviewedById(userId);
            doc.setReviewedAt(Instant.now());
            documentRepository.save(doc);
            log.info("Document {} re-approved by userId={} (already READY)", id, userId);
        } else {
            throw new InvalidRequestException("Chỉ có thể duyệt tài liệu ở trạng thái PENDING_REVIEW, FAILED hoặc READY");
        }

        Document updated = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        AccountResponse author = userService.findById(updated.getOwnerId()).orElse(null);
        SubjectDto subject = buildSubjectDto(updated.getSubjectId());
        return DocumentResponse.fromEntity(updated, toUserEntity(author), subject);
    }

    @Override
    @Transactional
    public void reclassify(Long id, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        if (doc.getStatus() != DocumentStatus.FAILED) {
            throw new InvalidRequestException("Chỉ có thể reclassify tài liệu ở trạng thái FAILED");
        }

        // Reset AI review fields — listener sẽ tự set status REVIEWING/INDEXING
        doc.setAiConfidence(null);
        doc.setAiWarningLevel(null);
        doc.setAiReviewStatus(null);
        doc.setReviewReason(null);
        documentRepository.save(doc);
        log.info("Document {} reclassify triggered by userId={}", id, userId);

        // Publish event để DocumentIngestListener chạy lại toàn bộ flow: classify → ingest
        eventPublisher.publishEvent(new DocumentIngestRequested(doc.getId()));
    }

    @Override
    @Transactional
    public void triggerIngest(Long id, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));

        doc.setReviewedById(userId);
        doc.setReviewedAt(Instant.now());
        doc.setIsPublic(true);
        log.info("Document {} triggerIngest by admin userId={}", id, userId);

        runIngestPipeline(doc);
    }

    @Override
    @Transactional
    public void processAutoApprovedDocuments() {
        List<Document> docs = documentRepository.findByStatusAndAiReviewStatus(
                DocumentStatus.REVIEWING, "AUTO_APPROVED");

        if (docs.isEmpty()) {
            return;
        }

        log.info("AutoApprovalScheduler: processing {} AI auto-approved document(s)", docs.size());
        for (Document doc : docs) {
            try {
                runIngestPipeline(doc);
            } catch (Exception e) {
                log.error("Document {} failed during AI auto-approve ingest: {}", doc.getId(), e.getMessage(), e);
                doc.setStatus(DocumentStatus.FAILED);
                documentRepository.save(doc);
            }
        }
    }

    /**
     * Gọi rag-service để ingest document, cập nhật status INDEXING → READY/FAILED.
     * Dùng chung cho admin duyệt thủ công (triggerIngest) và AI auto-approve (processAutoApprovedDocuments).
     */
    private void runIngestPipeline(Document doc) {
        Long id = doc.getId();
        doc.setStatus(DocumentStatus.INDEXING);
        documentRepository.save(doc);
        log.info("Document {} status set to INDEXING", id);

        RagIngestMetadata metadata = new RagIngestMetadata(
                null, null, null, java.util.List.of(),
                java.util.List.of(), java.util.List.of(),
                doc.getFolderId(), doc.getOwnerId()
        );

        RagIngestRequest ingestRequest = new RagIngestRequest(
                id,
                "DOCUMENT",
                doc.getTitle(),
                null,
                id,
                resolveInternalFilePath(doc),
                null,
                null,
                metadata,
                null
        );

        try {
            RagIngestResponse response = ragClientService.ingest(ingestRequest, null);

            if ("COMPLETED".equals(response.status())) {
                saveIngestedChunks(doc, response);
                doc.setChunkCount(response.chunks() != null ? response.chunks().size() : 0);
                doc.setContentHash(response.documentContentHash());

                String contentHash = response.documentContentHash();
                if (contentHash != null && !contentHash.isBlank()) {
                    // Khóa theo contentHash để 2 ingest đồng thời cùng nội dung không thể cùng
                    // lúc SELECT "không thấy nhau" rồi cùng lọt qua bước gắn cờ DANGER.
                    Object lock = contentHashLockRegistry.acquire(contentHash);
                    synchronized (lock) {
                        Document duplicate = documentRepository
                                .findFirstByContentHashAndOwnerIdNotAndStatusNot(
                                        contentHash, doc.getOwnerId(), DocumentStatus.SOFT_DELETED)
                                .orElse(null);
                        if (duplicate != null) {
                            doc.setStatus(DocumentStatus.PENDING_REVIEW);
                            doc.setAiWarningLevel("DANGER");
                            doc.setReviewReason("Trùng nội dung với tài liệu #" + duplicate.getId()
                                    + " của người dùng khác — nghi ngờ tải lại tài liệu công khai");
                            doc.setAiReviewStatus("PENDING_ADMIN");
                            documentRepository.save(doc);
                            log.warn("Document {} content-hash collides with doc #{} (owner {}), set PENDING_REVIEW",
                                    id, duplicate.getId(), duplicate.getOwnerId());
                            return;
                        }
                        // Lưu ngay trong lúc giữ lock để thread khác (đang chờ) sẽ thấy bản ghi
                        // này khi tới lượt SELECT của nó.
                        documentRepository.save(doc);
                    }
                    contentHashLockRegistry.release(contentHash, lock);
                }

                doc.setStatus(DocumentStatus.READY);
                documentRepository.save(doc);
                log.info("Document {} ingestion COMPLETED, chunks={}", id, doc.getChunkCount());
            } else {
                doc.setStatus(DocumentStatus.FAILED);
                documentRepository.save(doc);
                log.warn("Document {} ingestion FAILED: {}", id, response.status());
            }
        } catch (Exception e) {
            log.error("Document {} ingestion error: {}", id, e.getMessage(), e);
            doc.setStatus(DocumentStatus.FAILED);
            documentRepository.save(doc);
        }
    }

    @Override
    @Transactional
    public DocumentResponse reject(Long id, String reason, Long userId) {
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", id));
        doc.setStatus(DocumentStatus.REJECTED);
        doc.setIsPublic(false);
        doc.setReviewReason(reason);
        doc.setReviewedById(userId);
        doc.setReviewedAt(Instant.now());
        Document saved = documentRepository.save(doc);
        log.info("Document {} rejected by userId={}, reason={}", id, userId, reason);

        AccountResponse author = userService.findById(saved.getOwnerId()).orElse(null);
        SubjectDto subject = buildSubjectDto(saved.getSubjectId());
        return DocumentResponse.fromEntity(saved, toUserEntity(author), subject);
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
    public boolean allExistByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        List<Long> distinctIds = ids.stream().distinct().toList();
        long existingCount = documentRepository.countByIdInAndStatusNot(
                distinctIds, DocumentStatus.SOFT_DELETED);
        return existingCount == distinctIds.size();
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

    @Override
    @Transactional(readOnly = true)
    public boolean allValidByIdsAndOwner(List<Long> ids, Long ownerId) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        List<Long> distinctIds = ids.stream().distinct().toList();
        long validCount = documentRepository.countValidByIdInAndOwnerId(distinctIds, ownerId);
        return validCount == distinctIds.size();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean allReadyForAiByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        List<Long> distinctIds = ids.stream().distinct().toList();
        long readyCount = documentRepository.countReadyForAiByIdIn(distinctIds);
        return readyCount == distinctIds.size();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean allReadyForAiByIdsAndOwner(List<Long> ids, Long ownerId) {
        if (ids == null || ids.isEmpty()) {
            return true;
        }
        List<Long> distinctIds = ids.stream().distinct().toList();
        long readyCount = documentRepository.countReadyForAiByIdInAndOwnerId(distinctIds, ownerId);
        return readyCount == distinctIds.size();
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

    private String resolveInternalFilePath(Document doc) {
        return fileStorageService.resolveInternalPath(doc.getPublicId());
    }

    private String normalizeFormat(String format, String publicId) {
        if (format != null && !format.isBlank()) {
            return format.trim().toLowerCase().replace(".", "");
        }
        if (publicId != null && publicId.contains(".")) {
            return publicId.substring(publicId.lastIndexOf('.') + 1).toLowerCase();
        }
        return "bin";
    }

    private String contentType(String format) {
        return switch (format) {
            case "pdf" -> "application/pdf";
            case "txt", "md" -> "text/plain";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            default -> "application/octet-stream";
        };
    }

    private String buildDownloadFilename(Document doc, boolean watermarked, String format) {
        String title = doc.getTitle() == null || doc.getTitle().isBlank() ? "document" : doc.getTitle();
        String slug = title
                .trim()
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9._-]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            slug = "document";
        }
        String suffix = watermarked ? "-public-watermarked" : "";
        if (format == null || format.isBlank() || "bin".equals(format)) {
            return slug + suffix;
        }
        if (slug.toLowerCase().endsWith("." + format)) {
            slug = slug.substring(0, slug.length() - format.length() - 1);
        }
        return slug + suffix + "." + format;
    }

    private void saveIngestedChunks(Document doc, RagIngestResponse response) {
        documentChunkService.deleteByDocumentId(doc.getId());
        if (response.chunks() == null || response.chunks().isEmpty()) {
            return;
        }

        List<DocumentChunk> chunks = response.chunks().stream()
                .map(chunkResponse -> {
                    DocumentChunk chunk = new DocumentChunk();
                    chunk.setDocument(doc);
                    chunk.setSourceId(response.sourceId());
                    chunk.setSourceType("DOCUMENT");
                    chunk.setChunkIndex(chunkResponse.chunkIndex());
                    chunk.setQdrantPointId(chunkResponse.qdrantPointId());
                    chunk.setContentHash(chunkResponse.contentHash());
                    return chunk;
                })
                .toList();
        documentChunkService.saveAll(chunks);
    }
}
