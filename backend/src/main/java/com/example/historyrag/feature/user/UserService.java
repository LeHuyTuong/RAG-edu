package com.example.historyrag.feature.user;

public interface UserService {

    long countAll();

    long countByRole(User.UserRole role);
}
