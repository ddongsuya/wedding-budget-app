-- 체크리스트 카테고리 테이블
CREATE TABLE IF NOT EXISTS checklist_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 체크리스트 아이템 테이블
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  category_id UUID REFERENCES checklist_categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  due_period VARCHAR(20),
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),
  assigned_to VARCHAR(20) DEFAULT 'both',
  priority VARCHAR(20) DEFAULT 'medium',
  linked_expense_id UUID REFERENCES expenses(id),
  linked_venue_id UUID REFERENCES venues(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_checklist_items_couple ON checklist_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON checklist_items(due_date);
CREATE INDEX IF NOT EXISTS idx_checklist_categories_couple ON checklist_categories(couple_id);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_categories_updated_at
  BEFORE UPDATE ON checklist_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_updated_at();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_updated_at();
