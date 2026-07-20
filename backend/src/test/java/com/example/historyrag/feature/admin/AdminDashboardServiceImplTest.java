package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardResponse;
import com.example.historyrag.feature.document.DocumentService;
import com.example.historyrag.feature.document.DocumentStatus;
import com.example.historyrag.feature.subject.SubjectService;
import com.example.historyrag.feature.billing.UserSubscriptionRepository;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;
import com.example.historyrag.feature.billing.UserSubscriptionRepository;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceImplTest {

    @Mock
    private UserService userService;

    @Mock
    private DocumentService documentService;

    @Mock
    private SubjectService subjectService;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    private AdminDashboardServiceImpl adminDashboardService;

    @BeforeEach
    void setUp() {
        adminDashboardService = new AdminDashboardServiceImpl(userService, documentService, subjectService, userSubscriptionRepository);
    }

    @Test
    @DisplayName("Should return dashboard counts via service methods")
    void getDashboard_existingData_returnsDashboardSummary() {
        when(userService.countAll()).thenReturn(42L);
        when(userService.countByRole(User.UserRole.STUDENT)).thenReturn(40L);
        when(userService.countByRole(User.UserRole.ADMIN)).thenReturn(2L);
        when(userService.countByStatus(User.UserStatus.ACTIVE)).thenReturn(40L);
        when(userService.countByStatus(User.UserStatus.LOCKED)).thenReturn(2L);

        when(documentService.countAll()).thenReturn(10L);
        when(documentService.countByStatus(DocumentStatus.UPLOADING)).thenReturn(1L);
        when(documentService.countByStatus(DocumentStatus.INDEXING)).thenReturn(2L);
        when(documentService.countByStatus(DocumentStatus.REINDEXING)).thenReturn(0L);
        when(documentService.countByStatus(DocumentStatus.READY)).thenReturn(6L);
        when(documentService.countByStatus(DocumentStatus.FAILED)).thenReturn(1L);
        when(documentService.countByStatus(DocumentStatus.REJECTED)).thenReturn(0L);
        when(documentService.countByStatus(DocumentStatus.PENDING_REVIEW)).thenReturn(0L);

        when(subjectService.countAll()).thenReturn(3L);
        when(userSubscriptionRepository.countByStatus("ACTIVE"))
        .thenReturn(5L);

        when(userSubscriptionRepository.calculateTotalRevenue())
        .thenReturn(1200000L);

        when(userSubscriptionRepository.findAll())
        .thenReturn(List.of());

        DashboardResponse response = adminDashboardService.getDashboard();

        assertEquals(42L, response.accounts().total());
        assertEquals(40L, response.accounts().active());
        assertEquals(2L, response.accounts().banned());
        assertEquals(10L, response.documents().total());
        assertEquals(6L, response.documents().active());
        assertEquals(4L, response.documents().pending()); // 1+2+0+1 = 4
        assertEquals(3L, response.subjects().total());
        assertFalse(response.activities().isEmpty());
    }
}
