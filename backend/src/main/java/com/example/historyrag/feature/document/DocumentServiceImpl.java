package com.example.historyrag.feature.document;

import com.example.historyrag.shared.ResultPaginationDTO;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.setting.SettingService;
import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.folder.FolderService;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.file.StoredFile;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.PredicateSpecification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final FolderService folderService;
    private final SettingService settingService;
    private final FileStorageService fileStorageService;
    private final RagClientService ragClientService;
    private final ApplicationEventPublisher eventPublisher;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            FolderService folderService,
            SettingService settingService,
            FileStorageService fileStorageService,
            RagClientService ragClientService,
            ApplicationEventPublisher eventPublisher) {
        this.documentRepository = documentRepository;
        this.folderService = folderService;
        this.settingService = settingService;
        this.fileStorageService = fileStorageService;
        this.ragClientService = ragClientService;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public DocumentResponse create(MultipartFile file, CreateDocumentRequest request, Long ownerId) {
        if (request.folderId() != null) {
            if (!folderService.existsByIdAndOwner(request.folderId(), ownerId)) {
                throw new ResourceNotFoundException("Folder", "id", request.folderId());
            }
        }

        // Validate format + size via Config
        SettingResponse cfg = settingService.getConfig();
        String allowedTypes = cfg.allowedTypes();
        Set<String> allowed = Arrays.stream(allowedTypes.split(","))
                .map(String::trim).map(String::toLowerCase).collect(Collectors.toSet());

        String ext = extractExt(file.getOriginalFilename());
        if (!allowed.contains(ext)) {
            throw new InvalidRequestException("Định dạng file không được hỗ trợ. Chấp nhận: " + allowedTypes);
        }

        long maxBytes = Long.parseLong(cfg.maxSizeMb()) * 1_048_576L;
        if (file.getSize() > maxBytes) {
            throw new InvalidRequestException("File vượt quá kích thước tối đa (" + cfg.maxSizeMb() + "MB)");
        }

        // Lưu file xuống disk
        StoredFile stored = fileStorageService.store(file);

        Document document = new Document();
        document.setTitle(request.title());
        document.setDescription(request.description());
        document.setPublicId(stored.storedName());
        document.setFileUrl("/uploads/" + stored.storedName());
        document.setSizeInBytes(stored.sizeInBytes());
        document.setFormat(stored.format());
        document.setResourceType("file");
        document.setStatus(DocumentStatus.UPLOADING);
        document.setFolderId(request.folderId());
        document.setOwnerId(ownerId);
        document.setIsPublic(request.isPublic());
        document.setUploadedAt(Instant.now());

        Document saved = documentRepository.save(document);
        eventPublisher.publishEvent(new DocumentIngestRequested(saved.getId()));

        log.info("Document created: id={}, file={}, status=UPLOADING", saved.getId(), stored.storedName());
        return DocumentResponse.fromEntity(saved);
    }

    private String extractExt(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
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

        if (doc.getStatus() != DocumentStatus.FAILED && doc.getStatus() != DocumentStatus.READY) {
            throw new InvalidRequestException("Chỉ có thể reindex tài liệu ở trạng thái READY hoặc FAILED");
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

        // Xóa file vật lý khỏi disk
        fileStorageService.delete(doc.getPublicId());

        documentRepository.delete(doc);
        log.info("Document {} hard deleted (file + vectors + db)", id);
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
    @Transactional(readOnly = true)
    public long countActiveByFolderId(Long folderId) {
        return documentRepository.countByFolderIdAndStatusNot(folderId, DocumentStatus.SOFT_DELETED);
    }
}
