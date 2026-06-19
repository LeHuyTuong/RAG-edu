SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE folder (
    folder_id   BIGINT       NOT NULL AUTO_INCREMENT,
    folder_name VARCHAR(255) NOT NULL,
    owner_id    BIGINT       NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id),
    KEY idx_folder_owner (owner_id),
    CONSTRAINT fk_folder_owner FOREIGN KEY (owner_id) REFERENCES member (member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE document (
    document_id   BIGINT       NOT NULL AUTO_INCREMENT,
    title         VARCHAR(500) NOT NULL,
    description   TEXT         NULL,
    file_url      VARCHAR(2000) NULL,
    public_id     VARCHAR(500) NULL,
    size_in_bytes BIGINT       NULL,
    format        VARCHAR(20)  NULL,
    resource_type VARCHAR(20)  NULL DEFAULT 'raw',
    status        VARCHAR(20)  NOT NULL DEFAULT 'UPLOADING',
    folder_id     BIGINT       NULL,
    owner_id      BIGINT       NOT NULL,
    is_public     BOOLEAN      NOT NULL DEFAULT FALSE,
    page_count    INT          NULL,
    chunk_count   INT          NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (document_id),
    KEY idx_document_owner (owner_id),
    KEY idx_document_folder (folder_id),
    KEY idx_document_status (status),
    KEY idx_document_owner_public (owner_id, is_public),
    CONSTRAINT fk_document_owner FOREIGN KEY (owner_id) REFERENCES member (member_id) ON DELETE CASCADE,
    CONSTRAINT fk_document_folder FOREIGN KEY (folder_id) REFERENCES folder (folder_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
    ('upload.allowed_types', 'pdf,docx,txt,md', 'Các định dạng file được phép upload'),
    ('upload.max_size_mb', '20', 'Kích thước file tối đa (MB)');

SET FOREIGN_KEY_CHECKS = 1;
