package com.example.historyrag.feature.auth.dto;

import com.example.historyrag.feature.user.User;

import java.time.Instant;

public record RegisterResponse(
        Long id,
        String email,
        String name,
        String avatarUrl,
        User.UserStatus status,
        String role,
        Instant createdAt
) {
    public static RegisterResponse fromUser(User user) {
        return new RegisterResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getStatus(),
                user.getRole().name().toLowerCase(),
                user.getCreatedAt()
        );
    }
}
