SET NAMES utf8mb4;

CREATE TABLE document_download (
    download_id      BIGINT       NOT NULL AUTO_INCREMENT,
    document_id      BIGINT       NOT NULL,
    user_id          BIGINT       NULL,
    downloader_email VARCHAR(255) NULL,
    watermarked      BOOLEAN      NOT NULL DEFAULT FALSE,
    ip_address       VARCHAR(45)  NULL,
    downloaded_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (download_id),
    KEY idx_dd_document (document_id),
    KEY idx_dd_user (user_id),
    KEY idx_dd_downloaded_at (downloaded_at),
    CONSTRAINT fk_dd_document FOREIGN KEY (document_id) REFERENCES document (document_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
