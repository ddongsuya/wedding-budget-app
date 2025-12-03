-- 이벤트/일정 테이블
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- 날짜/시간
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT FALSE,
  
  -- 카테고리 및 스타일
  category VARCHAR(50),
  color VARCHAR(20) DEFAULT '#FDA4AF',
  icon VARCHAR(50),
  
  -- 위치
  location VARCHAR(300),
  location_url VARCHAR(500),
  
  -- 알림
  reminder_minutes INTEGER,
  
  -- 연결
  linked_venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  linked_checklist_id UUID REFERENCES checklist_items(id) ON DELETE SET NULL,
  linked_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  
  -- 담당자
  assigned_to VARCHAR(20) DEFAULT 'both',
  
  -- 반복 (선택적)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule VARCHAR(100),
  
  -- 메타
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_events_couple ON events(couple_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();
