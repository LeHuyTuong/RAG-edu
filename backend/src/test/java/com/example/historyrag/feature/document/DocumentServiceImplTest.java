package com.example.historyrag.feature.document;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.folder.FolderService;
import com.example.historyrag.feature.setting.SettingService;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.file.StoredFile;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceImplTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private FolderService folderService;
    @Mock private SettingService settingService;
    @Mock private FileStorageService fileStorageService;
    @Mock private RagClientService ragClientService;
    @Mock private ApplicationEventPublisher eventPublisher;

    private DocumentServiceImpl documentService;

    @BeforeEach
    void setUp() {
        documentService = new DocumentServiceImpl(
                documentRepository,
                folderService,
                settingService,
                fileStorageService,
                ragClientService,
                eventPublisher);
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
                        new UpdateDocumentRequest(null, null, foreignFolderId, null),
                        ownerId));

        verify(documentRepository, never()).save(document);
    }

    @Test
    @DisplayName("create — should reject mismatched file content type")
    void create_contentTypeDoesNotMatchExtension_throwsInvalidRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lesson.pdf",
                "text/plain",
                "not really a pdf".getBytes());
        when(settingService.getConfig()).thenReturn(new SettingResponse("pdf,docx,txt,md", "20"));

        assertThrows(InvalidRequestException.class,
                () -> documentService.create(
                        file,
                        new CreateDocumentRequest("Lesson", null, null, false),
                        10L));

        verify(fileStorageService, never()).store(any());
        verify(documentRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("create — should delete stored file when transaction rolls back")
    void create_databaseFailure_registersStoredFileRollbackCleanup() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "lesson.txt",
                "text/plain",
                "content".getBytes());
        when(settingService.getConfig()).thenReturn(new SettingResponse("pdf,docx,txt,md", "20"));
        when(fileStorageService.store(file)).thenReturn(new StoredFile("stored.txt", 7L, "txt"));
        when(documentRepository.saveAndFlush(any(Document.class))).thenThrow(new RuntimeException("db down"));

        TransactionSynchronizationManager.initSynchronization();
        try {
            assertThrows(RuntimeException.class,
                    () -> documentService.create(
                            file,
                            new CreateDocumentRequest("Lesson", null, null, false),
                            10L));

            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(synchronization -> synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }

        verify(fileStorageService).delete("stored.txt");
    }
}
