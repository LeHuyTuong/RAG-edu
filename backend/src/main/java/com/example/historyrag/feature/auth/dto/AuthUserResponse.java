package com.example.historyrag.feature.auth.dto;

import com.example.historyrag.feature.user.User;

import java.time.Instant;

public record AuthUserResponse(
        Long id,
        String username,
        String email,
        String fullName,
        User.UserStatus status,
        String role,
        Instant createdAt
) {
    public static AuthUserResponse fromUser(User user) {
        return new AuthUserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getStatus(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }
}
