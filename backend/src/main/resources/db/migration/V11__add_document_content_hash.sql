SET NAMES utf8mb4;

ALTER TABLE document
    ADD COLUMN content_hash VARCHAR(64) NULL AFTER chunk_count;
ALTER TABLE document ADD INDEX idx_document_content_hash (content_hash);
