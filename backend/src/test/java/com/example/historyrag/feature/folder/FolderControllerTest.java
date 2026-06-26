package com.example.historyrag.feature.folder;

import com.example.historyrag.feature.folder.dto.FolderResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.Instant;
import java.util.Map;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class FolderControllerTest {

    @Mock private FolderService folderService;
    @Mock private com.example.historyrag.feature.rag.RagService ragService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new FolderController(folderService, ragService))
                .setValidator(validator)
                .setCustomArgumentResolvers(new JwtArgumentResolver())
                .build();
    }

    @Test
    void create_validFolderName_callsService() throws Exception {
        when(folderService.create("History", 10L))
                .thenReturn(new FolderResponse(1L, "History", 10L, 0L, Instant.now(), Instant.now()));

        mockMvc.perform(post("/api/v1/folders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folderName\":\"History\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.folderName").value("History"));

        verify(folderService).create("History", 10L);
    }

    @Test
    void rename_blankFolderName_returnsBadRequest() throws Exception {
        mockMvc.perform(patch("/api/v1/folders/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folderName\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    private static class JwtArgumentResolver implements HandlerMethodArgumentResolver {
        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                    && Jwt.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(
                MethodParameter parameter,
                ModelAndViewContainer mavContainer,
                NativeWebRequest webRequest,
                WebDataBinderFactory binderFactory) {
            return new Jwt(
                    "access-token",
                    Instant.now(),
                    Instant.now().plusSeconds(60),
                    Map.of("alg", "HS384"),
                    Map.of("sub", "member@example.com", "userId", 10L));
        }
    }
}
