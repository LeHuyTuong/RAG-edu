package com.example.historyrag.feature.document;

import com.example.historyrag.dto.ResultPaginationDTO;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.config.SystemSettingRepository;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.folder.FolderRepository;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final RagClientService ragClientService;
    private final ApplicationEventPublisher eventPublisher;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            FolderRepository folderRepository,
            SystemSettingRepository systemSettingRepository,
            RagClientService ragClientService,
            ApplicationEventPublisher eventPublisher) {
        this.documentRepository = documentRepository;
        this.folderRepository = folderRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.ragClientService = ragClientService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public DocumentResponse create(CreateDocumentRequest request, Long ownerId) {
        // Verify folder ownership if folderId provided
        if (request.folderId() != null) {
            if (!folderRepository.existsByIdAndOwnerId(request.folderId(), ownerId)) {
                throw new ResourceNotFoundException("Folder", "id", request.folderId());
            }
        }

        // Validate format against config
        String allowedTypes = systemSettingRepository.findBySettingKey("upload.allowed_types")
                .map(s -> s.getSettingValue())
                .orElse("pdf,docx,txt,md");
        Set<String> allowed = Arrays.stream(allowedTypes.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        if (!allowed.contains(request.format().toLowerCase())) {
            throw new InvalidRequestException(
                    "Định dạng file không được hỗ trợ. Chấp nhận: " + allowedTypes);
        }

        // Validate size against config
        String maxSizeStr = systemSettingRepository.findBySettingKey("upload.max_size_mb")
                .map(s -> s.getSettingValue())
                .orElse("20");
        long maxSizeBytes = Long.parseLong(maxSizeStr) * 1_048_576L;
        if (request.sizeInBytes() != null && request.sizeInBytes() > maxSizeBytes) {
            throw new InvalidRequestException(
                    "File vượt quá kích thước tối đa cho phép (" + maxSizeStr + "MB)");
        }

        Document document = new Document();
        document.setTitle(request.title());
        document.setDescription(request.description());
        document.setFileUrl(request.fileUrl());
        document.setPublicId(request.publicId());
        document.setSizeInBytes(request.sizeInBytes());
        document.setFormat(request.format());
        document.setResourceType(request.resourceType());
        document.setStatus(DocumentStatus.UPLOADING);
        document.setFolderId(request.folderId());
        document.setOwnerId(ownerId);
        document.setIsPublic(request.isPublic());

        Document saved = documentRepository.save(document);

        // Fire async ingestion
        eventPublisher.publishEvent(new DocumentIngestRequested(saved.getId()));

        log.info("Document created: id={}, status=UPLOADING, ingestion queued", saved.getId());
        return DocumentResponse.fromEntity(saved);
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
            doc.setFolderId(request.folderId());
        }
        if (request.isPublic() != null) {
            doc.setIsPublic(request.isPublic());
        }

        return DocumentResponse.fromEntity(documentRepository.save(doc));
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

        return DocumentResponse.fromEntity(doc);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getMyDocuments(Long ownerId) {
        return documentRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .filter(doc -> doc.getStatus() != DocumentStatus.SOFT_DELETED)
                .map(DocumentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResultPaginationDTO filter(String search, Long folderId, DocumentStatus status,
                                       Long ownerId, Boolean onlyMine, Pageable pageable) {
        PredicateSpecification<Document> spec = DocumentSpecification.build(
                search, folderId, status, Boolean.TRUE.equals(onlyMine) ? ownerId : null);

        Page<DocumentResponse> pageResult = documentRepository.findBy(spec, q -> q.page(pageable))
                .map(DocumentResponse::fromEntity);
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

        if (doc.getStatus() != DocumentStatus.FAILED) {
            throw new InvalidRequestException("Chỉ có thể reindex tài liệu ở trạng thái FAILED");
        }

        doc.setStatus(DocumentStatus.UPLOADING);
        documentRepository.save(doc);
        eventPublisher.publishEvent(new DocumentIngestRequested(doc.getId()));
    }
}
