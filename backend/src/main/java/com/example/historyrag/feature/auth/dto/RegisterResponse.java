package com.example.historyrag.feature.auth.dto;

import com.example.historyrag.feature.user.User;

import java.time.Instant;

public record RegisterResponse(
        Long id,
        String username,
        String email,
        String fullName,
        User.UserStatus status,
        String role,
        Instant createdAt
) {
    public static RegisterResponse fromUser(User user) {
        return new RegisterResponse(
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
