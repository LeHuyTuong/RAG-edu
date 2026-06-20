package com.example.historyrag.feature.auth;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidTokenException;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.auth.dto.LoginRequest;
import com.example.historyrag.feature.auth.dto.LoginResponse;
import com.example.historyrag.feature.auth.dto.RegisterRequest;
import com.example.historyrag.feature.auth.dto.RegisterResponse;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtEncoder jwtEncoder;
    @Mock private JwtDecoder jwtDecoder;
    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                authenticationManager, jwtEncoder, jwtDecoder,
                userRepository, refreshTokenRepository, passwordEncoder,
                900L, 259200L);
    }

    @Test
    @DisplayName("login — should issue tokens and store hashed refresh token")
    void login_validCredentials_returnsTokensAndStoresRefreshToken() {
        User user = user(1L, "student@example.com", "student", User.UserRole.STUDENT);
        when(userRepository.findByEmail("student@example.com")).thenReturn(Optional.of(user));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(fakeJwt("access-token"), fakeJwt("refresh-token"));

        LoginResponse response = authService.login(
                new LoginRequest("student@example.com", "password123"), "JUnit", "127.0.0.1");

        assertEquals("access-token", response.accessToken());
        assertEquals("refresh-token", response.refreshToken());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken saved = captor.getValue();
        assertEquals(user, saved.getUser());
        assertEquals(sha256("refresh-token"), saved.getTokenHash());
        assertFalse(saved.getRevoked());
    }

    @Test
    @DisplayName("register — should create STUDENT user with generated username")
    void register_missingUsername_generatesUsernameAndSavesUser() {
        RegisterRequest request = new RegisterRequest(null, "Nguyen Van A", "nva@example.com", "password123");
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByUsername("nva")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });

        RegisterResponse response = authService.register(request);

        assertEquals(10L, response.id());
        assertEquals("nva", response.username());
        assertEquals("STUDENT", response.role());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals(User.UserRole.STUDENT, captor.getValue().getRole());
        assertEquals("hashed", captor.getValue().getPasswordHash());
    }

    @Test
    @DisplayName("register — should reject duplicate email")
    void register_duplicateEmail_throwsDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest("u", "Name", "dup@example.com", "password123");
        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("refresh — should rotate token and revoke old one")
    void refresh_validToken_rotatesAndRevokesOld() {
        User user = user(1L, "s@example.com", "s", User.UserRole.STUDENT);
        RefreshToken stored = refreshToken(user, "old-token", false, Instant.now().plusSeconds(600));
        stored.setDeviceInfo("JUnit");
        stored.setIpAddress("127.0.0.1");

        when(jwtDecoder.decode("old-token"))
                .thenReturn(refreshJwt("old-token", "s@example.com", "refresh"));
        when(refreshTokenRepository.findByTokenHash(sha256("old-token")))
                .thenReturn(Optional.of(stored));
        when(jwtEncoder.encode(any(JwtEncoderParameters.class)))
                .thenReturn(fakeJwt("new-access"), fakeJwt("new-refresh"));

        LoginResponse response = authService.refresh("old-token");

        assertEquals("new-access", response.accessToken());
        assertTrue(stored.getRevoked());
    }

    @Test
    @DisplayName("refresh — should reject revoked token")
    void refresh_revokedToken_throwsInvalidTokenException() {
        User user = user(1L, "s@example.com", "s", User.UserRole.STUDENT);
        RefreshToken stored = refreshToken(user, "old-token", true, Instant.now().plusSeconds(600));

        when(jwtDecoder.decode("old-token"))
                .thenReturn(refreshJwt("old-token", "s@example.com", "refresh"));
        when(refreshTokenRepository.findByTokenHash(sha256("old-token")))
                .thenReturn(Optional.of(stored));

        assertThrows(InvalidTokenException.class, () -> authService.refresh("old-token"));
    }

    @Test
    @DisplayName("refresh — should reject token with wrong type claim")
    void refresh_wrongType_throwsInvalidTokenException() {
        when(jwtDecoder.decode("access-token"))
                .thenReturn(refreshJwt("access-token", "s@example.com", "access"));

        assertThrows(InvalidTokenException.class, () -> authService.refresh("access-token"));
        verify(refreshTokenRepository, never()).findByTokenHash(anyString());
    }

    @Test
    @DisplayName("logout — should revoke the stored token")
    void logout_validToken_revokesStoredToken() {
        User user = user(1L, "s@example.com", "s", User.UserRole.STUDENT);
        RefreshToken stored = refreshToken(user, "rt", false, Instant.now().plusSeconds(600));
        when(refreshTokenRepository.findByTokenHash(sha256("rt"))).thenReturn(Optional.of(stored));

        authService.logout("rt");

        assertTrue(stored.getRevoked());
    }

    @Test
    @DisplayName("getMe — should return admin profile")
    void getMe_adminUser_returnsAdminResponse() {
        User admin = user(99L, "admin@example.com", "admin", User.UserRole.ADMIN);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));

        AuthUserResponse response = authService.getMe("admin@example.com", "ADMIN");

        assertEquals(99L, response.id());
        assertEquals("ADMIN", response.role());
    }

    // ── helpers ──────────────────────────────────────────────────────

    private User user(Long id, String email, String username, User.UserRole role) {
        User u = new User();
        u.setId(id);
        u.setEmail(email);
        u.setUsername(username);
        u.setFullName("Test User");
        u.setPasswordHash("hashed");
        u.setRole(role);
        u.setStatus(User.UserStatus.ACTIVE);
        return u;
    }

    private RefreshToken refreshToken(User user, String rawToken, boolean revoked, Instant expiresAt) {
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(sha256(rawToken));
        rt.setRevoked(revoked);
        rt.setExpiresAt(expiresAt);
        rt.setCreatedAt(Instant.now());
        return rt;
    }

    private Jwt fakeJwt(String tokenValue) {
        return new Jwt(tokenValue, Instant.now(), Instant.now().plusSeconds(900),
                Map.of("alg", "HS384"),
                Map.of("sub", "sub@example.com"));
    }

    private Jwt refreshJwt(String tokenValue, String subject, String type) {
        return new Jwt(tokenValue, Instant.now(), Instant.now().plusSeconds(259200),
                Map.of("alg", "HS384"),
                Map.of("sub", subject, "type", type));
    }

    private String sha256(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
