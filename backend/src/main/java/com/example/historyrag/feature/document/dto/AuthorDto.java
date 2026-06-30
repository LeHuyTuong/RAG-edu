package com.example.historyrag.feature.document.dto;

import com.example.historyrag.feature.user.User;

public record AuthorDto(
        Long id,
        String name,
        String avatarUrl
) {
    public static AuthorDto fromUser(User user) {
        if (user == null) return null;
        return new AuthorDto(
                user.getId(),
                user.getFullName(),
                user.getAvatarUrl()
        );
    }
}
