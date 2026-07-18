package com.example.historyrag.feature.document;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.folder.FolderService;
import com.example.historyrag.feature.document.chunk.DocumentChunkRepository;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.user.UserService;
import com.example.historyrag.feature.user.dto.AccountResponse;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.file.PdfWatermarkService;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceImplTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private FolderService folderService;
    @Mock private UserService userService;
    @Mock private SubjectService subjectService;
    @Mock private RagClientService ragClientService;
    @Mock private FileStorageService fileStorageService;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private DocumentChunkRepository documentChunkRepository;
    @Mock private PdfWatermarkService pdfWatermarkService;
    @Mock private com.example.historyrag.feature.billing.BillingService billingService;

    private DocumentServiceImpl documentService;

    @BeforeEach
    void setUp() {
        documentService = new DocumentServiceImpl(
                documentRepository,
                folderService,
                userService,
                subjectService,
                ragClientService,
                fileStorageService,
                eventPublisher,
                documentChunkRepository,
                pdfWatermarkService,
                billingService,
                new ContentHashLockRegistry());
    }

    @Test
    @DisplayName("update — should reject folder that does not belong to owner")
    void update_folderOwnedByAnotherUser_throwsNotFound() {
        Long ownerId = 10L;
        Long foreignFolderId = 99L;
        Document document = new Document();
        document.setId(1L);
        document.setOwnerId(ownerId);

        when(documentRepository.findById(1L)).thenReturn(Optional.of(document));
        when(folderService.existsByIdAndOwner(foreignFolderId, ownerId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> documentService.update(
                        1L,
                        new UpdateDocumentRequest(null, null, null, foreignFolderId, null, null),
                        ownerId));

        verify(documentRepository, never()).save(document);
    }

    @Test
    @DisplayName("create — should reject folder that does not belong to owner")
    void create_folderOwnedByAnotherUser_throwsNotFound() {
        CreateDocumentRequest request = new CreateDocumentRequest(
                "Lesson", null, null,
                "https://res.cloudinary.com/demo/lesson.pdf",
                "demo/lesson.pdf",1000L,"pdf","raw",null,false,99L);
        when(folderService.existsByIdAndOwner(99L, 10L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> documentService.create(request, 10L));

        verify(documentRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("getById — should allow admin to view pending review document owned by another user")
    void getById_adminCanViewPendingReviewDocumentOwnedByAnotherUser() {
        Document document = document(150004L, DocumentStatus.PENDING_REVIEW, "pending.pdf");
        when(documentRepository.findById(150004L)).thenReturn(Optional.of(document));

        DocumentResponse response = documentService.getById(150004L, 1L, true);

        assertEquals(150004L, response.id());
        assertEquals("PENDING", response.status());
        assertEquals(DocumentStatus.PENDING_REVIEW, response.ragStatus());
    }

    @Test
    @DisplayName("getById — should keep hiding pending review document from non-owner user")
    void getById_normalUserCannotViewPendingReviewDocumentOwnedByAnotherUser() {
        Document document = document(150004L, DocumentStatus.PENDING_REVIEW, "pending.pdf");
        when(documentRepository.findById(150004L)).thenReturn(Optional.of(document));

        assertThrows(ResourceNotFoundException.class, () -> documentService.getById(150004L, 1L, false));
    }

    @Test
    @DisplayName("allExistByIds — should validate distinct non-deleted documents without owner constraint")
    void allExistByIds_distinctNonDeletedDocuments_returnsTrue() {
        when(documentRepository.countByIdInAndStatusNot(List.of(150004L, 150005L), DocumentStatus.SOFT_DELETED))
                .thenReturn(2L);

        assertTrue(documentService.allExistByIds(List.of(150004L, 150004L, 150005L)));
    }

    @Test
    @DisplayName("allExistByIds — should return false when any document is missing or soft-deleted")
    void allExistByIds_missingOrSoftDeletedDocument_returnsFalse() {
        when(documentRepository.countByIdInAndStatusNot(List.of(150004L, 150005L), DocumentStatus.SOFT_DELETED))
                .thenReturn(1L);

        assertFalse(documentService.allExistByIds(List.of(150004L, 150005L)));
    }

    @Test
    @DisplayName("approve — should publish FAILED document without blocking on ingest (sets INDEXING)")
    void approve_failedDocument_marksReadyWithoutBlockingOnIngest() {
        Document document = document(7L, DocumentStatus.FAILED, "failed.pdf");
        when(documentRepository.findById(7L)).thenReturn(Optional.of(document));

        documentService.approve(7L, 1L);

        verify(ragClientService, never()).ingest(any(), any());
        verify(eventPublisher).publishEvent(new DocumentIngestRequested(7L));
        assertEquals(DocumentStatus.INDEXING, document.getStatus());
        assertTrue(document.getIsPublic());
        assertEquals(1L, document.getReviewedById());
    }

    @Test
    @DisplayName("approve — should not revive REJECTED document")
    void approve_rejectedDocument_throwsInvalidRequest() {
        Document document = document(8L, DocumentStatus.REJECTED, "rejected.pdf");
        when(documentRepository.findById(8L)).thenReturn(Optional.of(document));

        assertThrows(InvalidRequestException.class, () -> documentService.approve(8L, 1L));

        assertEquals(DocumentStatus.REJECTED, document.getStatus());
        verify(ragClientService, never()).ingest(any(), any());
    }

    @Test
    @DisplayName("reject — should make document private and keep explicit rejection state")
    void reject_setsRejectedAndPrivate() {
        Document document = document(9L, DocumentStatus.READY, "ready.pdf");
        document.setIsPublic(true);
        when(documentRepository.findById(9L)).thenReturn(Optional.of(document));
        when(documentRepository.save(document)).thenReturn(document);

        documentService.reject(9L, "Sai chủ đề", 1L);

        assertEquals(DocumentStatus.REJECTED, document.getStatus());
        assertFalse(document.getIsPublic());
        assertEquals("Sai chủ đề", document.getReviewReason());
        assertEquals(1L, document.getReviewedById());
    }

    @Test
    @DisplayName("reindex — should not restart ingestion for REJECTED document")
    void reindex_rejectedDocument_throwsInvalidRequest() {
        Document document = document(10L, DocumentStatus.REJECTED, "rejected.pdf");
        when(documentRepository.findById(10L)).thenReturn(Optional.of(document));

        assertThrows(InvalidRequestException.class, () -> documentService.reindex(10L, 20L));

        assertEquals(DocumentStatus.REJECTED, document.getStatus());
        verify(eventPublisher, never()).publishEvent(any());
    }

    private static Document document(Long id, DocumentStatus status, String publicId) {
        Document document = new Document();
        document.setId(id);
        document.setTitle("Tài liệu " + id);
        document.setFileUrl("http://localhost:8080/uploads/" + publicId);
        document.setPublicId(publicId);
        document.setStatus(status);
        document.setOwnerId(20L);
        document.setFolderId(30L);
        document.setIsPublic(false);
        return document;
    }
}
