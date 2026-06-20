package com.example.historyrag.feature.auth;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.exception.InvalidTokenException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.auth.dto.LoginRequest;
import com.example.historyrag.feature.auth.dto.LoginResponse;
import com.example.historyrag.feature.auth.dto.RegisterRequest;
import com.example.historyrag.feature.auth.dto.RegisterResponse;
import com.example.historyrag.feature.user.User;
import com.example.historyrag.feature.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final String REFRESH_TOKEN_TYPE = "refresh";

    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final JwtDecoder jwtDecoder;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
            JwtEncoder jwtEncoder,
            JwtDecoder jwtDecoder,
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.jwtDecoder = jwtDecoder;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String deviceInfo, String ipAddress) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.email()));

        String accessToken = generateAccessToken(user);
        String refreshToken = generateRefreshToken(user);
        saveRefreshToken(refreshToken, user, deviceInfo, ipAddress);

        log.info("User logged in: id={}, role={}", user.getId(), user.getRole());
        return new LoginResponse(accessToken, refreshToken);
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new DuplicateResourceException("User", "email", request.email());
        }

        String username = resolveAvailableUsername(request);
        User user = new User();
        user.setUsername(username);
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.name());
        user.setRole(User.UserRole.STUDENT);
        user.setStatus(User.UserStatus.ACTIVE);

        User saved = userRepository.save(user);
        log.info("Student registered: id={}", saved.getId());
        return RegisterResponse.fromUser(saved);
    }

    @Override
    @Transactional
    public LoginResponse refresh(String rawRefreshToken) {
        decodeRefreshToken(rawRefreshToken);
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token không hợp lệ"));

        validateStoredRefreshToken(storedToken);
        storedToken.setRevoked(true);

        User user = storedToken.getUser();
        String newAccessToken = generateAccessToken(user);
        String newRefreshToken = generateRefreshToken(user);
        saveRefreshToken(newRefreshToken, user, storedToken.getDeviceInfo(), storedToken.getIpAddress());

        log.info("Refresh token rotated: userId={}", user.getId());
        return new LoginResponse(newAccessToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Refresh token không hợp lệ"));
        storedToken.setRevoked(true);
        log.info("Refresh token revoked");
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getMe(String email, String accountType) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return AuthUserResponse.fromUser(user);
    }

    // ────────────────────────────────────────────────
    // JWT generation
    // STUDENT → ROLE_USER (Spring convention); ADMIN → ROLE_ADMIN
    // JWT `role` claim = "STUDENT" / "ADMIN" (cho frontend)
    // ────────────────────────────────────────────────
    private String generateAccessToken(User user) {
        Instant now = Instant.now();
        String springRole = user.getRole() == User.UserRole.ADMIN ? "ROLE_ADMIN" : "ROLE_USER";
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(accessTokenExpiration))
                .claim("userId", user.getId())
                .claim("accountType", user.getRole().name())
                .claim("roles", List.of(springRole))
                .claim("role", user.getRole().name())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS384).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private String generateRefreshToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(UUID.randomUUID().toString())
                .subject(user.getEmail())
                .issuedAt(now)
                .expiresAt(now.plusSeconds(refreshTokenExpiration))
                .claim("userId", user.getId())
                .claim("type", REFRESH_TOKEN_TYPE)
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS384).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    private void saveRefreshToken(String rawToken, User user, String deviceInfo, String ipAddress) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(rawToken));
        refreshToken.setExpiresAt(Instant.now().plusSeconds(refreshTokenExpiration));
        refreshToken.setDeviceInfo(deviceInfo);
        refreshToken.setIpAddress(ipAddress);
        refreshToken.setRevoked(false);
        refreshTokenRepository.save(refreshToken);
    }

    private void validateStoredRefreshToken(RefreshToken storedToken) {
        if (Boolean.TRUE.equals(storedToken.getRevoked())) {
            throw new InvalidTokenException("Refresh token đã bị thu hồi");
        }
        if (storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidTokenException("Refresh token đã hết hạn");
        }
    }

    private Jwt decodeRefreshToken(String rawRefreshToken) {
        try {
            Jwt jwt = jwtDecoder.decode(rawRefreshToken);
            if (!REFRESH_TOKEN_TYPE.equals(jwt.getClaimAsString("type"))) {
                throw new InvalidTokenException("Token không phải refresh token");
            }
            return jwt;
        } catch (JwtException ex) {
            throw new InvalidTokenException("Refresh token không hợp lệ");
        }
    }

    private String resolveAvailableUsername(RegisterRequest request) {
        String requestedUsername = request.username();
        String baseUsername = requestedUsername == null || requestedUsername.isBlank()
                ? request.email().substring(0, request.email().indexOf('@'))
                : requestedUsername;
        baseUsername = normalizeUsername(baseUsername);

        if (baseUsername.isBlank()) {
            throw new InvalidRequestException("Username không hợp lệ");
        }

        String candidate = baseUsername;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            String suffixText = String.valueOf(suffix);
            int maxBaseLength = 50 - suffixText.length();
            candidate = baseUsername.substring(0, Math.min(baseUsername.length(), maxBaseLength)) + suffixText;
            suffix++;
        }
        return candidate;
    }

    private String normalizeUsername(String username) {
        String normalized = username.trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "");
        return normalized.length() > 50 ? normalized.substring(0, 50) : normalized;
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}
