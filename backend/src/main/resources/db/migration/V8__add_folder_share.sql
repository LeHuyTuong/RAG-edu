ALTER TABLE folder
    ADD COLUMN share_token VARCHAR(36),
    ADD COLUMN share_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE folder
    ADD UNIQUE KEY uk_folder_share_token (share_token);
