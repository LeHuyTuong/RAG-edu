-- V4__add_subject.sql — Subject table + document.subject_id FK
-- Subject stores academic subjects (môn học) for document classification.

CREATE TABLE subject (
    subject_id  BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50)  NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (subject_id),
    UNIQUE KEY uq_subject_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE document ADD COLUMN subject_id BIGINT NULL AFTER resource_type;
ALTER TABLE document ADD CONSTRAINT fk_document_subject
    FOREIGN KEY (subject_id) REFERENCES subject (subject_id) ON DELETE SET NULL;

ALTER TABLE document ADD COLUMN reviewed_by_id BIGINT NULL AFTER review_reason;
ALTER TABLE document ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by_id;
