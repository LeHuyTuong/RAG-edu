package com.example.historyrag.feature.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.exception.InvalidTokenException;
import com.example.historyrag.feature.auth.dto.AuthUserResponse;
import com.example.historyrag.feature.auth.dto.LoginRequest;
import com.example.historyrag.feature.auth.dto.LoginResponse;
import com.example.historyrag.feature.auth.dto.RefreshRequest;
import com.example.historyrag.feature.auth.dto.RegisterRequest;
import com.example.historyrag.feature.auth.dto.RegisterResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private static final String COOKIE_PATH = "/api/v1/auth";

    private final AuthService authService;
    private final long refreshTokenExpiration;
    private final boolean refreshCookieSecure;

    public AuthController(AuthService authService,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration,
            @Value("${app.auth.refresh-cookie.secure:false}") boolean refreshCookieSecure) {
        this.authService = authService;
        this.refreshTokenExpiration = refreshTokenExpiration;
        this.refreshCookieSecure = refreshCookieSecure;
    }

    @PostMapping({"/login", "/signin"})
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String deviceInfo = httpRequest.getHeader("User-Agent");
        String ipAddress = extractClientIp(httpRequest);

        LoginResponse loginResponse = authService.login(request, deviceInfo, ipAddress);
        setRefreshTokenCookie(httpResponse, loginResponse.refreshToken());

        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", loginResponse));
    }

    @PostMapping({"/register", "/signup"})
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Đăng ký thành công", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @RequestBody(required = false) RefreshRequest body,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String rawRefreshToken = extractRefreshToken(body, httpRequest);
        if (rawRefreshToken == null) {
            throw new InvalidTokenException("Refresh token không được cung cấp");
        }

        LoginResponse loginResponse = authService.refresh(rawRefreshToken);
        setRefreshTokenCookie(httpResponse, loginResponse.refreshToken());

        return ResponseEntity.ok(ApiResponse.success("Token đã được làm mới", loginResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String rawRefreshToken = extractRefreshTokenFromCookie(httpRequest);
        if (rawRefreshToken != null) {
            try {
                authService.logout(rawRefreshToken);
            } catch (InvalidTokenException ex) {
                log.warn("Ignoring invalid refresh token during logout: {}", ex.getMessage());
            }
        }
        clearRefreshTokenCookie(httpResponse);

        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthUserResponse>> getMe(
            @AuthenticationPrincipal Jwt jwt) {

        String email = jwt.getSubject();
        String accountType = jwt.getClaimAsString("accountType");
        AuthUserResponse userResponse = authService.getMe(email, accountType);
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    private String extractRefreshToken(RefreshRequest body, HttpServletRequest request) {
        String fromCookie = extractRefreshTokenFromCookie(request);
        if (fromCookie != null) {
            return fromCookie;
        }
        if (body != null && body.refreshToken() != null && !body.refreshToken().isBlank()) {
            return body.refreshToken();
        }
        return null;
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String rawToken) {
        response.setHeader("Set-Cookie",
                REFRESH_TOKEN_COOKIE_NAME + "=" + rawToken
                        + "; HttpOnly" + secureCookieAttribute()
                        + "; SameSite=Lax; Path=" + COOKIE_PATH
                        + "; Max-Age=" + refreshTokenExpiration);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        response.setHeader("Set-Cookie",
                REFRESH_TOKEN_COOKIE_NAME + "=; HttpOnly" + secureCookieAttribute()
                        + "; SameSite=Lax; Path=" + COOKIE_PATH + "; Max-Age=0");
    }

    private String secureCookieAttribute() {
        return refreshCookieSecure ? "; Secure" : "";
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
