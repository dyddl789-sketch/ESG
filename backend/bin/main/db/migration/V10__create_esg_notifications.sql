-- 승인 요청·승인·반려 알림 영구 저장
CREATE TABLE IF NOT EXISTS esg_notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    company_id INT REFERENCES companies(id) ON DELETE CASCADE,
    metric_id BIGINT REFERENCES esg_metric_data(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_url VARCHAR(1024),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_esg_notifications_type CHECK (
        notification_type IN ('ESG_APPROVAL_REQUESTED', 'ESG_APPROVED', 'ESG_REJECTED')
    )
);

CREATE INDEX IF NOT EXISTS idx_esg_notifications_recipient_created
    ON esg_notifications (recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_esg_notifications_recipient_unread
    ON esg_notifications (recipient_user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_esg_notifications_metric
    ON esg_notifications (metric_id, created_at DESC);
