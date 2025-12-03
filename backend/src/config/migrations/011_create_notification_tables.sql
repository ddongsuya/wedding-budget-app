-- 011_create_notification_tables.sql
-- 알림 시스템 테이블 생성

-- 1. notifications 테이블 (알림 저장)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 2. notification_preferences 테이블 (알림 설정)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    dday_enabled BOOLEAN DEFAULT TRUE,
    dday_daily BOOLEAN DEFAULT FALSE,
    schedule_enabled BOOLEAN DEFAULT TRUE,
    checklist_enabled BOOLEAN DEFAULT TRUE,
    budget_enabled BOOLEAN DEFAULT TRUE,
    couple_enabled BOOLEAN DEFAULT TRUE,
    announcement_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    preferred_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- notification_preferences 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- 3. push_subscriptions 테이블 (푸시 구독 정보)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- push_subscriptions 인덱스
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- 알림 타입 체크 제약조건
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_notification_type;
ALTER TABLE notifications ADD CONSTRAINT check_notification_type 
    CHECK (type IN (
        'dday_milestone',
        'dday_daily',
        'schedule_reminder',
        'checklist_due',
        'checklist_overdue',
        'budget_warning',
        'budget_exceeded',
        'couple_activity',
        'announcement'
    ));

-- 코멘트 추가
COMMENT ON TABLE notifications IS '사용자 알림 저장 테이블';
COMMENT ON TABLE notification_preferences IS '사용자별 알림 설정 테이블';
COMMENT ON TABLE push_subscriptions IS 'Web Push 구독 정보 테이블';

COMMENT ON COLUMN notifications.type IS '알림 타입: dday_milestone, dday_daily, schedule_reminder, checklist_due, checklist_overdue, budget_warning, budget_exceeded, couple_activity, announcement';
COMMENT ON COLUMN notifications.data IS '알림 관련 추가 데이터 (JSON)';
COMMENT ON COLUMN notifications.link IS '알림 클릭 시 이동할 경로';
COMMENT ON COLUMN notification_preferences.preferred_time IS '일일 알림 수신 희망 시간';
