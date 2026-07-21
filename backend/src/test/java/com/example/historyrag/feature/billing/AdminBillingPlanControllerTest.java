package com.example.historyrag.feature.billing;

import com.example.historyrag.feature.billing.dto.AdminBillingPlanRequest;
import com.example.historyrag.feature.billing.dto.AdminBillingPlanResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminBillingPlanControllerTest {

    @Mock
    private BillingPlanAdminService planAdminService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        AdminBillingPlanController controller = new AdminBillingPlanController(planAdminService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    @DisplayName("findAll should return admin plan list")
    void findAll_existingPlans_returnsWrappedList() throws Exception {
        when(planAdminService.findAll()).thenReturn(List.of(response(1L, "FREE")));

        mockMvc.perform(get("/api/v1/admin/billing/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data[0].code").value("FREE"));
    }

    @Test
    @DisplayName("create should return created plan with location")
    void create_validRequest_returnsCreatedPlan() throws Exception {
        when(planAdminService.create(any(AdminBillingPlanRequest.class))).thenReturn(response(3L, "PRO"));

        mockMvc.perform(post("/api/v1/admin/billing/plans")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request("PRO"))))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/admin/billing/plans/3"))
                .andExpect(jsonPath("$.message").value("Tạo gói thành công"))
                .andExpect(jsonPath("$.data.code").value("PRO"));
    }

    @Test
    @DisplayName("update should return updated plan")
    void update_validRequest_returnsUpdatedPlan() throws Exception {
        when(planAdminService.update(eq(3L), any(AdminBillingPlanRequest.class))).thenReturn(response(3L, "PRO"));

        mockMvc.perform(patch("/api/v1/admin/billing/plans/3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request("PRO"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật gói thành công"))
                .andExpect(jsonPath("$.data.id").value(3));
    }

    @Test
    @DisplayName("deactivate should call service and return success")
    void deactivate_existingPlan_returnsSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/billing/plans/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Ngừng kích hoạt gói thành công"));

        verify(planAdminService).deactivate(3L);
    }

    private AdminBillingPlanRequest request(String code) {
        return new AdminBillingPlanRequest(
                code,
                code,
                "Description",
                99000,
                "MONTHLY",
                1200,
                200,
                10240,
                100,
                3,
                true);
    }

    private AdminBillingPlanResponse response(Long id, String code) {
        return new AdminBillingPlanResponse(
                id,
                code,
                code,
                "Description",
                99000,
                "MONTHLY",
                1200,
                200,
                10240,
                100,
                3,
                true,
                null,
                null);
    }
}
