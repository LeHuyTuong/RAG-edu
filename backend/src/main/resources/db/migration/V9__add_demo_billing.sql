SET NAMES utf8mb4;

CREATE TABLE billing_plan (
    plan_id                 BIGINT       NOT NULL AUTO_INCREMENT,
    code                    VARCHAR(50)  NOT NULL,
    name                    VARCHAR(120) NOT NULL,
    description             VARCHAR(500) NULL,
    price_vnd               INT          NOT NULL DEFAULT 0,
    billing_cycle           VARCHAR(20)  NOT NULL DEFAULT 'MONTHLY',
    chat_credits_per_month  INT          NOT NULL DEFAULT 0,
    document_quota          INT          NOT NULL DEFAULT 0,
    storage_mb              INT          NOT NULL DEFAULT 0,
    max_file_size_mb        INT          NOT NULL DEFAULT 0,
    display_order           INT          NOT NULL DEFAULT 0,
    active                  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (plan_id),
    UNIQUE KEY uq_billing_plan_code (code),
    KEY idx_billing_plan_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_subscription (
    subscription_id BIGINT      NOT NULL AUTO_INCREMENT,
    user_id         BIGINT      NOT NULL,
    plan_id         BIGINT      NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    started_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    current_period_start DATETIME NOT NULL,
    current_period_end   DATETIME NOT NULL,
    demo_payment_reference VARCHAR(80) NULL,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (subscription_id),
    KEY idx_subscription_user_status (user_id, status),
    KEY idx_subscription_plan (plan_id),
    CONSTRAINT fk_subscription_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES billing_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usage_period (
    usage_period_id BIGINT      NOT NULL AUTO_INCREMENT,
    user_id         BIGINT      NOT NULL,
    subscription_id BIGINT      NULL,
    period_start    DATETIME    NOT NULL,
    period_end      DATETIME    NOT NULL,
    chat_limit      INT         NOT NULL DEFAULT 0,
    chat_used       INT         NOT NULL DEFAULT 0,
    document_limit  INT         NOT NULL DEFAULT 0,
    document_used   INT         NOT NULL DEFAULT 0,
    storage_mb_limit INT        NOT NULL DEFAULT 0,
    storage_mb_used  INT        NOT NULL DEFAULT 0,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (usage_period_id),
    KEY idx_usage_period_user_window (user_id, period_start, period_end),
    KEY idx_usage_period_subscription (subscription_id),
    CONSTRAINT fk_usage_period_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_usage_period_subscription FOREIGN KEY (subscription_id) REFERENCES user_subscription (subscription_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE usage_event (
    usage_event_id BIGINT       NOT NULL AUTO_INCREMENT,
    user_id        BIGINT       NOT NULL,
    usage_period_id BIGINT      NULL,
    event_type     VARCHAR(40)  NOT NULL,
    amount         INT          NOT NULL DEFAULT 1,
    description    VARCHAR(255) NULL,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (usage_event_id),
    KEY idx_usage_event_user_type (user_id, event_type),
    KEY idx_usage_event_period (usage_period_id),
    CONSTRAINT fk_usage_event_user FOREIGN KEY (user_id) REFERENCES user (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_usage_event_period FOREIGN KEY (usage_period_id) REFERENCES usage_period (usage_period_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO billing_plan
    (code, name, description, price_vnd, billing_cycle, chat_credits_per_month, document_quota, storage_mb, max_file_size_mb, display_order, active)
VALUES
    ('FREE', 'Free', 'Dùng thử AI với giới hạn nhẹ cho tài khoản mới.', 0, 'MONTHLY', 10, 5, 200, 20, 1, TRUE),
    ('STUDENT_PLUS', 'Student Plus', 'Gói học tập hằng tháng cho nhu cầu hỏi AI thường xuyên.', 49000, 'MONTHLY', 300, 50, 2048, 50, 2, TRUE),
    ('PRO', 'Pro', 'Gói nâng cao cho học nhóm, nhiều tài liệu và nhiều lượt hỏi AI.', 99000, 'MONTHLY', 1200, 200, 10240, 100, 3, TRUE)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    price_vnd = VALUES(price_vnd),
    chat_credits_per_month = VALUES(chat_credits_per_month),
    document_quota = VALUES(document_quota),
    storage_mb = VALUES(storage_mb),
    max_file_size_mb = VALUES(max_file_size_mb),
    display_order = VALUES(display_order),
    active = VALUES(active);
