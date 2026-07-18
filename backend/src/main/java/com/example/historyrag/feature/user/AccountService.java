package com.example.historyrag.feature.user;

import com.example.historyrag.feature.user.dto.AccountResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AccountService {

    List<AccountResponse> findAll(String role, String status, String createdFrom, String createdTo, Pageable pageable);

    AccountResponse findById(Long id);

    AccountResponse create(String email, String name, String password, String avatarUrl, String role, String status);

    AccountResponse update(Long id, String name, String avatarUrl);

    AccountResponse toggleBan(Long id);

    void delete(Long id);
}
