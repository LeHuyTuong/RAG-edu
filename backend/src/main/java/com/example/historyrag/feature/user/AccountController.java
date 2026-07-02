package com.example.historyrag.feature.user;

import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.shared.JwtUtils;
import com.example.historyrag.feature.user.dto.AccountResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    private void assertSelfOrAdmin(Jwt jwt, Long id) {
        boolean isAdmin = "ADMIN".equalsIgnoreCase(jwt.getClaimAsString("accountType"));
        if (!isAdmin && !JwtUtils.getUserId(jwt).equals(id)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập tài khoản này");
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> findAll(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String createdFrom,
            @RequestParam(required = false) String createdTo,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "20") int limit) {
        List<AccountResponse> accounts = accountService.findAll(
                role, status, createdFrom, createdTo, PageRequest.of(page - 1, limit));
        return ResponseEntity.ok(ApiResponse.success(accounts));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(accountService.findById(id)));
    }

    public record CreateAccountRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 1, max = 255) String name,
            @NotBlank @Size(min = 6) String password,
            String avatarUrl,
            String role,
            String status
    ) {}

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> create(
            @Valid @RequestBody CreateAccountRequest request) {
        AccountResponse response = accountService.create(
                request.email(), request.name(), request.password(),
                request.avatarUrl(), request.role(), request.status());
        URI location = URI.create("/api/v1/accounts/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo tài khoản thành công", response));
    }

    public record UpdateAccountRequest(
            String name,
            String avatarUrl
    ) {}

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AccountResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        assertSelfOrAdmin(jwt, id);
        return ResponseEntity.ok(ApiResponse.success(
                accountService.update(id, request.name(), request.avatarUrl())));
    }

    @PatchMapping("/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AccountResponse>> toggleBan(@PathVariable Long id) {
        AccountResponse response = accountService.toggleBan(id);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái tài khoản thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        assertSelfOrAdmin(jwt, id);
        accountService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản thành công", null));
    }
}
