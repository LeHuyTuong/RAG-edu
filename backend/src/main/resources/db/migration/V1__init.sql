-- V1__init.sql — RAG-edu schema (5 bảng)
-- user, refresh_token, folder, document, setting
-- MySQL 8, InnoDB, utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- USER (single table — role = STUDENT | ADMIN)
-- ============================================================================
CREATE TABLE user (
    user_id       BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'STUDENT',  -- STUDENT | ADMIN
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | LOCKED
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_username (username),
    UNIQUE KEY uq_user_email (email),
    KEY idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- REFRESH TOKEN
-- ============================================================================
CREATE TABLE refresh_token (
    refresh_token_id BIGINT       NOT NULL AUTO_INCREMENT,
    user_id          BIGINT       NOT NULL,
    token_hash       VARCHAR(255) NOT NULL,
    expires_at       DATETIME     NOT NULL,
    revoked          BOOLEAN      NOT NULL DEFAULT FALSE,
    device_info      VARCHAR(255) NULL,
    ip_address       VARCHAR(45)  NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (refresh_token_id),
    KEY idx_refresh_token_hash (token_hash),
    KEY idx_refresh_token_user (user_id),
    KEY idx_refresh_token_expires (expires_at),
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- FOLDER
-- ============================================================================
CREATE TABLE folder (
    folder_id   BIGINT       NOT NULL AUTO_INCREMENT,
    folder_name VARCHAR(255) NOT NULL,
    owner_id    BIGINT       NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id),
    KEY idx_folder_owner (owner_id),
    CONSTRAINT fk_folder_owner FOREIGN KEY (owner_id) REFERENCES user (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- DOCUMENT
-- ============================================================================
CREATE TABLE document (
    document_id   BIGINT        NOT NULL AUTO_INCREMENT,
    title         VARCHAR(500)  NOT NULL,
    description   TEXT          NULL,
    file_url      VARCHAR(2000) NULL,
    public_id     VARCHAR(500)  NULL,
    size_in_bytes BIGINT        NULL,
    format        VARCHAR(20)   NULL,
    resource_type VARCHAR(20)   NULL DEFAULT 'raw',
    status        VARCHAR(20)   NOT NULL DEFAULT 'UPLOADING',
    -- UPLOADING | INDEXING | REINDEXING | READY | FAILED | SOFT_DELETED
    folder_id     BIGINT        NULL,
    owner_id      BIGINT        NOT NULL,
    is_public     BOOLEAN       NOT NULL DEFAULT FALSE,
    page_count    INT           NULL,
    chunk_count   INT           NULL,
    uploaded_at   DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id),
    KEY idx_document_owner (owner_id),
    KEY idx_document_folder (folder_id),
    KEY idx_document_status (status),
    CONSTRAINT fk_document_owner  FOREIGN KEY (owner_id)  REFERENCES user   (user_id)   ON DELETE CASCADE,
    CONSTRAINT fk_document_folder FOREIGN KEY (folder_id) REFERENCES folder (folder_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SETTING (bảng 1 dòng — allowed_types + max_size_mb)
-- ============================================================================
CREATE TABLE setting (
    setting_id     INT         NOT NULL AUTO_INCREMENT,
    allowed_types VARCHAR(255) NOT NULL DEFAULT 'pdf,docx,txt,md',
    max_size_mb   INT         NOT NULL DEFAULT 20,
    updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed dòng setting mặc định
INSERT INTO setting (allowed_types, max_size_mb) VALUES ('pdf,docx,txt,md', 20);

-- ============================================================================
-- Seed: tài khoản admin mặc định
-- password = "Admin@123" — BCrypt hash (thay hash này trước khi production)
-- Tạo hash mới: https://bcrypt-generator.com/ (rounds=10)
-- ============================================================================
INSERT INTO user (username, email, password_hash, full_name, role, status)
VALUES (
    'admin',
    'admin@historyrag.edu.vn',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    'System Administrator',
    'ADMIN',
    'ACTIVE'
);

SET FOREIGN_KEY_CHECKS = 1;
