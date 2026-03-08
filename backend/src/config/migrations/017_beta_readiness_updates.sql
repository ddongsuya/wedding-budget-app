-- Beta Readiness Updates Migration
-- 베타 배포 준비 종합 리뷰에서 도출된 DB 스키마 변경

-- 1. venues 테이블에 제외 사유 컬럼 추가 (요구사항 6.3)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS exclusion_reason TEXT;

-- 2. photo_references 테이블에 정렬 순서 컬럼 추가 (요구사항 11.3)
ALTER TABLE photo_references ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. notifications 테이블에 재시도 관련 컬럼 추가 (요구사항 9.5)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS last_retry_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'sent';

-- 4. expenses 테이블에 연관 체크리스트 항목 ID 추가 (요구사항 3.2)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS checklist_item_id INTEGER REFERENCES checklist_items(id) ON DELETE SET NULL;

-- 5. events 테이블에 연관 체크리스트 항목 ID 추가 (요구사항 3.2)
ALTER TABLE events ADD COLUMN IF NOT EXISTS checklist_item_id INTEGER REFERENCES checklist_items(id) ON DELETE SET NULL;

-- 6. events 테이블에 연관 식장 ID 추가 (요구사항 2.4)
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_expenses_checklist_item ON expenses(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_events_checklist_item ON events(checklist_item_id);
CREATE INDEX IF NOT EXISTS idx_events_venue ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_photo_references_sort ON photo_references(couple_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_notifications_retry ON notifications(delivery_status, retry_count);
