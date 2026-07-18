ALTER TABLE document
    ADD COLUMN ai_confidence DOUBLE,
    ADD COLUMN ai_warning_level VARCHAR(10),
    ADD COLUMN ai_review_status VARCHAR(20);
