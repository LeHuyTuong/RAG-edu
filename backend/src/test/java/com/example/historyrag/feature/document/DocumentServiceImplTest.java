package com.example.historyrag.feature.document;

import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.document.dto.CreateDocumentRequest;
import com.example.historyrag.feature.document.dto.UpdateDocumentRequest;
import com.example.historyrag.feature.folder.FolderService;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.user.UserService;
import com.example.historyrag.feature.user.dto.AccountResponse;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
                        new UpdateDocumentRequest(null, null, foreignFolderId, null, null),
                        ownerId));

        verify(documentRepository, never()).save(document);
    }

    @Test
    @DisplayName("create — should reject folder that does not belong to owner")
    void create_folderOwnedByAnotherUser_throwsNotFound() {
        CreateDocumentRequest request = new CreateDocumentRequest(
                "Lesson", null,
                "https://res.cloudinary.com/demo/lesson.pdf",
                "demo/lesson.pdf",1000L,"pdf","raw",null,false,99L);
        when(folderService.existsByIdAndOwner(99L, 10L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class,
                () -> documentService.create(request, 10L));

        verify(documentRepository, never()).saveAndFlush(any());
    }
}
