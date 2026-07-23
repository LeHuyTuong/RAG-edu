package com.example.historyrag.feature.document;

import com.example.historyrag.feature.document.event.DocumentIngestRequested;
import com.example.historyrag.feature.document.chunk.DocumentChunkService;
import com.example.historyrag.infrastructure.file.FileStorageService;
import com.example.historyrag.infrastructure.webclient.RagClientService;
import com.example.historyrag.infrastructure.webclient.dto.RagClassifyRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagClassifyResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestRequest;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestResponse;
import com.example.historyrag.infrastructure.webclient.dto.RagIngestedChunkResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentIngestListenerTest {

    @Mock private DocumentRepository documentRepository;
    @Mock private RagClientService ragClientService;
    @Mock private FileStorageService fileStorageService;
    @Mock private DocumentChunkService documentChunkService;

    @Test
    @DisplayName("handleDocumentIngest — should classify then auto-approve with confidence >= 0.9")
    void handleDocumentIngest_autoApprove_highConfidence() {
        Document document = document(7L, DocumentStatus.UPLOADING, "lesson.pdf");
        when(documentRepository.findById(7L)).thenReturn(Optional.of(document));
        when(fileStorageService.resolveInternalPath("lesson.pdf")).thenReturn("/app/uploads/lesson.pdf");
        when(ragClientService.classify(any(RagClassifyRequest.class), isNull()))
                .thenReturn(new RagClassifyResponse(7L, true, 0.95, "HISTORY", "OK"));
        when(ragClientService.ingest(any(RagIngestRequest.class), isNull()))
                .thenReturn(new RagIngestResponse(
                        7L,
                        "COMPLETED",
                        "history_chunks",
                        "gemini-embedding-001",
                        "abc123hash",
                        List.of(new RagIngestedChunkResponse(0, "point-1", "hash-1"))
                ));
        DocumentIngestListener listener = new DocumentIngestListener(
                documentRepository,
                ragClientService,
                fileStorageService,
                documentChunkService,
                true,
                new ContentHashLockRegistry()
        );

        listener.handleDocumentIngest(new DocumentIngestRequested(7L));

        ArgumentCaptor<RagClassifyRequest> classifyCaptor = ArgumentCaptor.forClass(RagClassifyRequest.class);
        verify(ragClientService).classify(classifyCaptor.capture(), isNull());
        assertEquals("/app/uploads/lesson.pdf", classifyCaptor.getValue().filePath());
        assertNull(classifyCaptor.getValue().sourceUrl());

        ArgumentCaptor<RagIngestRequest> ingestCaptor = ArgumentCaptor.forClass(RagIngestRequest.class);
        verify(ragClientService).ingest(ingestCaptor.capture(), isNull());
        assertEquals("/app/uploads/lesson.pdf", ingestCaptor.getValue().filePath());
        assertNull(ingestCaptor.getValue().sourceUrl());
        assertEquals("AUTO_APPROVED", document.getAiReviewStatus());
        assertEquals("NONE", document.getAiWarningLevel());
        assertEquals(DocumentStatus.READY, document.getStatus());
        verify(documentChunkService).deleteByDocumentId(7L);
        verify(documentChunkService).saveAll(any());
    }

    @Test
    @DisplayName("handleDocumentIngest — should classify then ingest when review disabled")
    void handleDocumentIngest_reviewDisabled_ingestDirectly() {
        Document document = document(7L, DocumentStatus.UPLOADING, "lesson.pdf");
        when(documentRepository.findById(7L)).thenReturn(Optional.of(document));
        when(fileStorageService.resolveInternalPath("lesson.pdf")).thenReturn("/app/uploads/lesson.pdf");
        when(ragClientService.ingest(any(RagIngestRequest.class), isNull()))
                .thenReturn(new RagIngestResponse(
                        7L,
                        "COMPLETED",
                        "history_chunks",
                        "gemini-embedding-001",
                        "abc123hash",
                        List.of(new RagIngestedChunkResponse(0, "point-1", "hash-1"))
                ));
        DocumentIngestListener listener = new DocumentIngestListener(
                documentRepository,
                ragClientService,
                fileStorageService,
                documentChunkService,
                false, // review disabled
                new ContentHashLockRegistry()
        );

        listener.handleDocumentIngest(new DocumentIngestRequested(7L));

        verify(ragClientService, never()).classify(any(), any());
        ArgumentCaptor<RagIngestRequest> ingestCaptor = ArgumentCaptor.forClass(RagIngestRequest.class);
        verify(ragClientService).ingest(ingestCaptor.capture(), isNull());
        assertEquals("/app/uploads/lesson.pdf", ingestCaptor.getValue().filePath());
        assertNull(ingestCaptor.getValue().sourceUrl());
        assertEquals(DocumentStatus.READY, document.getStatus());
        verify(documentChunkService).deleteByDocumentId(7L);
        verify(documentChunkService).saveAll(any());
    }

    @Test
    @DisplayName("handleDocumentIngest — should not revive REJECTED document")
    void handleDocumentIngest_rejectedDocumentDoesNotCallRag() {
        Document document = document(8L, DocumentStatus.REJECTED, "rejected.pdf");
        when(documentRepository.findById(8L)).thenReturn(Optional.of(document));
        DocumentIngestListener listener = new DocumentIngestListener(
                documentRepository,
                ragClientService,
                fileStorageService,
                documentChunkService,
                true,
                new ContentHashLockRegistry()
        );

        listener.handleDocumentIngest(new DocumentIngestRequested(8L));

        assertEquals(DocumentStatus.REJECTED, document.getStatus());
        verify(ragClientService, never()).classify(any(), any());
        verify(ragClientService, never()).ingest(any(), any());
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
