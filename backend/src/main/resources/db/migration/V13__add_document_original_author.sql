SET NAMES utf8mb4;

ALTER TABLE document
    ADD COLUMN original_author VARCHAR(255) NULL AFTER title;
