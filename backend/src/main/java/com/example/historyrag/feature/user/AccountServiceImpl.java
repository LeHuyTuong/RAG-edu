package com.example.historyrag.feature.user;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.user.dto.AccountResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AccountServiceImpl implements AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountResponse> findAll(String role, String status, String createdFrom, String createdTo, Pageable pageable) {
        if (role != null || status != null || createdFrom != null || createdTo != null) {
            // Apply filters via Specification
            return userRepository.findAll((root, query, cb) -> {
                List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

                if (role != null && !role.isBlank()) {
                    // Frontend values: "ADMIN", "USER" → backend: ADMIN, STUDENT
                    if ("ADMIN".equalsIgnoreCase(role)) {
                        predicates.add(cb.equal(root.get("role"), User.UserRole.ADMIN));
                    } else if ("USER".equalsIgnoreCase(role)) {
                        predicates.add(cb.equal(root.get("role"), User.UserRole.STUDENT));
                    }
                }
                if (status != null && !status.isBlank()) {
                    // Frontend values: "ACTIVE", "BANNED" → backend: ACTIVE, LOCKED
                    if ("BANNED".equalsIgnoreCase(status)) {
                        predicates.add(cb.equal(root.get("status"), User.UserStatus.LOCKED));
                    } else if ("ACTIVE".equalsIgnoreCase(status)) {
                        predicates.add(cb.equal(root.get("status"), User.UserStatus.ACTIVE));
                    }
                }
                if (createdFrom != null && !createdFrom.isBlank()) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"),
                            java.time.Instant.parse(createdFrom)));
                }
                if (createdTo != null && !createdTo.isBlank()) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"),
                            java.time.Instant.parse(createdTo)));
                }

                return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
            }, pageable).stream().map(AccountResponse::fromUser).toList();
        }
        return userRepository.findAll(pageable).stream()
                .map(AccountResponse::fromUser)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AccountResponse findById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        return AccountResponse.fromUser(user);
    }

    @Override
    @Transactional
    public AccountResponse create(String email, String name, String password, String avatarUrl, String role, String status) {
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Account", "email", email);
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(name);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setAvatarUrl(avatarUrl);

        // Role mapping: "ADMIN" → ADMIN, "USER" → STUDENT
        user.setRole("ADMIN".equalsIgnoreCase(role) ? User.UserRole.ADMIN : User.UserRole.STUDENT);

        // Status mapping: "ACTIVE" → ACTIVE, "BANNED" → LOCKED
        user.setStatus("BANNED".equalsIgnoreCase(status) ? User.UserStatus.LOCKED : User.UserStatus.ACTIVE);

        // Generate username from email
        String username = email.indexOf('@') > 0 ? email.substring(0, email.indexOf('@')) : email;
        if (!userRepository.existsByUsername(username)) {
            user.setUsername(username);
        } else {
            user.setUsername(username + System.currentTimeMillis());
        }

        User saved = userRepository.save(user);
        log.info("Account created by admin: id={}, email={}, role={}", saved.getId(), email, role);
        return AccountResponse.fromUser(saved);
    }

    @Override
    @Transactional
    public AccountResponse update(Long id, String name, String avatarUrl) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));

        if (name != null) {
            user.setFullName(name);
        }
        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }

        User saved = userRepository.save(user);
        log.info("Account updated by admin: id={}", id);
        return AccountResponse.fromUser(saved);
    }

    @Override
    @Transactional
    public void toggleBan(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));

        if (user.getStatus() == User.UserStatus.LOCKED) {
            user.setStatus(User.UserStatus.ACTIVE);
            log.info("Account unbanned by admin: id={}", id);
        } else {
            user.setStatus(User.UserStatus.LOCKED);
            log.info("Account banned by admin: id={}", id);
        }
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "id", id));
        userRepository.delete(user);
        log.info("Account deleted by admin: id={}", id);
    }
}
