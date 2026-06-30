package com.example.historyrag.feature.admin;

import com.example.historyrag.feature.admin.dto.DashboardResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminDashboardControllerTest {

    @Mock
    private AdminDashboardService adminDashboardService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AdminDashboardController controller = new AdminDashboardController(adminDashboardService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("Should return dashboard response wrapper")
    void getDashboard_existingSummary_returnsDashboardResponse() throws Exception {
        var accounts = new DashboardResponse.AccountStats(42L, 40L, 2L, 0L);
        var documents = new DashboardResponse.DocumentStats(10L, 6L, 4L, 0L);
        var subjects = new DashboardResponse.SubjectStats(0L);
        when(adminDashboardService.getDashboard())
                .thenReturn(new DashboardResponse(accounts, documents, subjects, List.of()));

        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.message").value("Lấy thông tin dashboard thành công"))
                .andExpect(jsonPath("$.data.accounts.total").value(42))
                .andExpect(jsonPath("$.data.accounts.active").value(40))
                .andExpect(jsonPath("$.data.documents.total").value(10))
                .andExpect(jsonPath("$.data.documents.active").value(6));
    }
}
