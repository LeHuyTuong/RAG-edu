package com.example.historyrag.feature.setting;

import com.example.historyrag.feature.setting.dto.SettingResponse;
import com.example.historyrag.feature.setting.dto.SettingUpdateRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SettingControllerTest {

    @Mock private SettingService settingService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new SettingController(settingService))
                .setValidator(validator)
                .build();
    }

    @Test
    void updateConfig_validRequest_callsService() throws Exception {
        SettingUpdateRequest request = new SettingUpdateRequest("pdf,txt", 25, "0 * * * * *");
        when(settingService.updateConfig(eq(request))).thenReturn(new SettingResponse("pdf,txt", "25", "0 * * * * *"));

        mockMvc.perform(patch("/api/v1/admin/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedTypes\":\"pdf,txt\",\"maxSizeMb\":25}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.maxSizeMb").value("25"));
    }

    @Test
    void updateConfig_invalidAllowedTypes_returnsBadRequest() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedTypes\":\"pdf, ../secret\",\"maxSizeMb\":25}"))
                .andExpect(status().isBadRequest());
    }
}
