-- users 테이블에 관리자 권한 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 공지사항 테이블 생성
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'notice', -- 'new', 'update', 'notice', 'maintenance'
  priority INTEGER DEFAULT 0, -- 0: 낮음, 1: 보통, 2: 높음, 3: 긴급
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON announcements(start_date, end_date);

-- 기본 공지사항 추가
INSERT INTO announcements (title, content, type, priority, is_active) VALUES
('Needless Wedding 런칭!', '결혼 준비의 모든 것을 한번에 관리하세요. 예산부터 식장 비교까지 스마트하게 도와드립니다. 💕', 'new', 2, true),
('v1.0.0 정식 출시', '커플 연결 기능과 실시간 데이터 동기화가 추가되었습니다.', 'update', 1, true),
('서비스 이용 안내', '더 나은 서비스 제공을 위해 지속적으로 업데이트하고 있습니다. 문의사항은 언제든 연락주세요.', 'notice', 0, true)
ON CONFLICT DO NOTHING;
