package com.example.historyrag.feature.document;

import com.example.historyrag.feature.audit.DownloadAuditService;
import com.example.historyrag.feature.document.dto.DocumentResponse;
import com.example.historyrag.shared.ResultPaginationDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentControllerTest {

    @Mock
    private DocumentService documentService;

    @Mock
    private DownloadAuditService downloadAuditService;

    @Mock
    private Jwt jwt;

    private DocumentController controller;

    @BeforeEach
    void setUp() {
        controller = new DocumentController(documentService, downloadAuditService);
        when(jwt.getClaim("userId")).thenReturn(10L);
    }

    @Test
    @DisplayName("filter — should request newest uploaded documents first")
    void filter_usesNewestFirstSort() {
        stubEmptyDocumentPage();

        controller.filter(null, null, null, null, false, 1, 10, jwt);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(documentService).filter(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(10L),
                eq(false),
                pageableCaptor.capture());

        assertNewestFirstSort(pageableCaptor.getValue().getSort());
    }

    @Test
    @DisplayName("getMyDocuments — should request newest uploaded documents first")
    void getMyDocuments_usesNewestFirstSort() {
        stubEmptyDocumentPage();

        controller.getMyDocuments(1, 10, null, null, jwt);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(documentService).filter(
                isNull(),
                isNull(),
                isNull(),
                isNull(),
                eq(10L),
                eq(true),
                pageableCaptor.capture());

        assertNewestFirstSort(pageableCaptor.getValue().getSort());
    }

    @Test
    @DisplayName("getById — should pass admin visibility flag for admin JWT")
    void getById_adminJwt_passesAdminVisibilityFlag() {
        when(jwt.getClaimAsString("accountType")).thenReturn("ADMIN");
        when(documentService.getById(150004L, 10L, true)).thenReturn(documentResponse(150004L));

        controller.getById(150004L, jwt);

        verify(documentService).getById(150004L, 10L, true);
    }

    @Test
    @DisplayName("getById — should not pass admin visibility flag for normal JWT")
    void getById_normalJwt_doesNotPassAdminVisibilityFlag() {
        when(jwt.getClaimAsString("accountType")).thenReturn("STUDENT");
        when(documentService.getById(150004L, 10L, false)).thenReturn(documentResponse(150004L));

        controller.getById(150004L, jwt);

        verify(documentService).getById(150004L, 10L, false);
    }

    private static void assertNewestFirstSort(Sort sort) {
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("uploadedAt").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("createdAt").getDirection());
        assertEquals(Sort.Direction.DESC, sort.getOrderFor("id").getDirection());
    }

    private void stubEmptyDocumentPage() {
        when(documentService.filter(any(), any(), any(), any(), any(), anyBoolean(), any(Pageable.class)))
                .thenReturn(new ResultPaginationDTO(
                        new ResultPaginationDTO.Meta(1, 10, 1, 0),
                        List.of()));
    }

    private static DocumentResponse documentResponse(Long id) {
        return new DocumentResponse(
                id,
                "Pending document",
                null,
                "http://localhost:8080/uploads/pending.pdf",
                "pending.pdf",
                1000L,
                "pdf",
                "raw",
                "PENDING",
                DocumentStatus.PENDING_REVIEW,
                null,
                20L,
                false,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                false
        );
    }
}
