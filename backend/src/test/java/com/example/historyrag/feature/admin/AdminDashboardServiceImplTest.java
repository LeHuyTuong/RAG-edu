package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock
    private UserService userService;

    @Mock
    private DocumentService documentService;

    private AdminDashboardServiceImpl adminDashboardService;

    @BeforeEach
    void setUp() {
        adminDashboardService = new AdminDashboardServiceImpl(userService, documentService);
    }

    @Test
    @DisplayName("Should return dashboard counts via service methods")
    void getDashboard_existingData_returnsDashboardSummary() {
        when(userService.countAll()).thenReturn(42L);
        when(userService.countByRole(User.UserRole.STUDENT)).thenReturn(40L);
        when(userService.countByRole(User.UserRole.ADMIN)).thenReturn(2L);

        when(documentService.countAll()).thenReturn(10L);
        when(documentService.countByStatus(DocumentStatus.UPLOADING)).thenReturn(1L);
        when(documentService.countByStatus(DocumentStatus.INDEXING)).thenReturn(2L);
        when(documentService.countByStatus(DocumentStatus.REINDEXING)).thenReturn(0L);
        when(documentService.countByStatus(DocumentStatus.READY)).thenReturn(6L);
        when(documentService.countByStatus(DocumentStatus.FAILED)).thenReturn(1L);

        DashboardResponse response = adminDashboardService.getDashboard();

        assertEquals(42L, response.totalUsers());
        assertEquals(40L, response.totalStudents());
        assertEquals(2L, response.totalAdmins());
        assertEquals(10L, response.totalDocuments());
        assertEquals(6L, response.readyDocs());
        assertEquals(1L, response.failedDocs());
        assertFalse(response.activities().isEmpty());
    }
}
