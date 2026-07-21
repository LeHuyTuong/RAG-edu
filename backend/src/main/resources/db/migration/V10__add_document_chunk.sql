SET NAMES utf8mb4;

CREATE TABLE document_chunk (
    chunk_id         BIGINT       NOT NULL AUTO_INCREMENT,
    document_id      BIGINT       NOT NULL,
    source_id        BIGINT       NOT NULL,
    source_type      VARCHAR(30)  NOT NULL DEFAULT 'DOCUMENT',
    chunk_index      INT          NOT NULL,
    qdrant_point_id  VARCHAR(120) NULL,
    content_hash     VARCHAR(128) NULL,
    content_preview  TEXT         NULL,
    token_count      INT          NULL,
    page_number      INT          NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (chunk_id),
    UNIQUE KEY uq_document_chunk_index (document_id, chunk_index),
    KEY idx_document_chunk_document (document_id),
    KEY idx_document_chunk_point (qdrant_point_id),
    CONSTRAINT fk_document_chunk_document
        FOREIGN KEY (document_id) REFERENCES document (document_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
