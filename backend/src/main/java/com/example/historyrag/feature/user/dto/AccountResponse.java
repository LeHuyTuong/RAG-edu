package com.example.historyrag.feature.user.dto;

import com.example.historyrag.feature.user.User;

import java.time.Instant;

public record AccountResponse(
        Long id,
        String email,
        String name,
        String avatarUrl,
        String role,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccountResponse fromUser(User user) {
        String roleStr = user.getRole() == User.UserRole.ADMIN ? "ADMIN" : "USER";
        String statusStr = user.getStatus() == User.UserStatus.LOCKED ? "BANNED" : "ACTIVE";
        return new AccountResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                roleStr,
                statusStr,
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
