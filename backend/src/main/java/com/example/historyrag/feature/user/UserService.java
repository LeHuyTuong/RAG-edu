package com.example.historyrag.feature.user;

import com.example.historyrag.feature.user.dto.AccountResponse;

import java.util.Optional;

public interface UserService {

    long countAll();

    long countByRole(User.UserRole role);

    long countByStatus(User.UserStatus status);

    Optional<AccountResponse> findById(Long id);
}
