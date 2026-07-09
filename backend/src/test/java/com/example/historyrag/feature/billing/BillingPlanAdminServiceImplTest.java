package com.example.historyrag.feature.billing;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.billing.dto.AdminBillingPlanRequest;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BillingPlanAdminServiceImplTest {

    private BillingPlanRepository planRepository;
    private BillingPlanAdminServiceImpl service;

    @BeforeEach
    void setUp() {
        planRepository = mock(BillingPlanRepository.class);
        service = new BillingPlanAdminServiceImpl(planRepository);
    }

    @Test
    @DisplayName("findAll should return every plan ordered by display order")
    void findAll_existingPlans_returnsAllPlans() {
        BillingPlan free = plan(1L, "FREE", true);
        BillingPlan pro = plan(2L, "PRO", false);
        when(planRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(free, pro));

        var response = service.findAll();

        assertEquals(2, response.size());
        assertEquals("FREE", response.getFirst().code());
        assertFalse(response.get(1).active());
    }

    @Test
    @DisplayName("create should normalize code and save plan")
    void create_validRequest_savesNormalizedPlan() {
        when(planRepository.existsByCodeIgnoreCase("STUDENT_PLUS")).thenReturn(false);
        when(planRepository.save(any(BillingPlan.class))).thenAnswer(invocation -> {
            BillingPlan saved = invocation.getArgument(0);
            saved.setId(10L);
            return saved;
        });

        var response = service.create(request(" student_plus ", "Student Plus", "MONTHLY"));

        assertEquals(10L, response.id());
        assertEquals("STUDENT_PLUS", response.code());
        verify(planRepository).save(any(BillingPlan.class));
    }

    @Test
    @DisplayName("create should reject duplicated plan code")
    void create_duplicateCode_throwsDuplicateResourceException() {
        when(planRepository.existsByCodeIgnoreCase("PRO")).thenReturn(true);

        assertThrows(
                DuplicateResourceException.class,
                () -> service.create(request("PRO", "Pro", "MONTHLY")));
    }

    @Test
    @DisplayName("update should reject unsupported billing cycle")
    void update_invalidBillingCycle_throwsInvalidRequestException() {
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan(1L, "FREE", true)));

        assertThrows(
                InvalidRequestException.class,
                () -> service.update(1L, request("FREE", "Free", "WEEKLY")));
    }

    @Test
    @DisplayName("deactivate should only mark plan inactive")
    void deactivate_existingPlan_setsInactive() {
        BillingPlan plan = plan(1L, "FREE", true);
        when(planRepository.findById(1L)).thenReturn(Optional.of(plan));
        when(planRepository.save(plan)).thenReturn(plan);

        service.deactivate(1L);

        assertFalse(plan.getActive());
        verify(planRepository).save(plan);
    }

    private AdminBillingPlanRequest request(String code, String name, String billingCycle) {
        return new AdminBillingPlanRequest(
                code,
                name,
                "Description",
                49000,
                billingCycle,
                300,
                50,
                2048,
                50,
                2,
                true);
    }

    private BillingPlan plan(Long id, String code, Boolean active) {
        BillingPlan plan = new BillingPlan();
        plan.setId(id);
        plan.setCode(code);
        plan.setName(code);
        plan.setDescription("Description");
        plan.setPriceVnd(0);
        plan.setBillingCycle(BillingConstants.DEFAULT_BILLING_CYCLE);
        plan.setChatCreditsPerMonth(10);
        plan.setDocumentQuota(5);
        plan.setStorageMb(200);
        plan.setMaxFileSizeMb(20);
        plan.setDisplayOrder(id.intValue());
        plan.setActive(active);
        return plan;
    }
}
