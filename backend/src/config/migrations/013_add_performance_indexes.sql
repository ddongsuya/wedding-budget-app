-- 013_add_performance_indexes.sql
-- 데이터베이스 성능 최적화를 위한 인덱스 추가
-- Requirements: 3.2 - 데이터베이스 쿼리 최적화

-- =====================================================
-- USERS 테이블 인덱스
-- =====================================================
-- 이메일 검색 (로그인, 중복 확인)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 커플 ID로 사용자 조회
CREATE INDEX IF NOT EXISTS idx_users_couple_id ON users(couple_id);

-- 관리자 조회
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- 생성일 기준 정렬
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- 계정 잠금 상태 확인
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

-- =====================================================
-- COUPLES 테이블 인덱스
-- =====================================================
-- 사용자로 커플 조회
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON couples(user2_id);

-- 초대 코드로 커플 조회
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code) WHERE invite_code IS NOT NULL;

-- =====================================================
-- VENUES 테이블 인덱스
-- =====================================================
-- 커플별 식장 조회 (가장 빈번한 쿼리)
CREATE INDEX IF NOT EXISTS idx_venues_couple_id ON venues(couple_id);

-- 상태별 필터링
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

-- 타입별 필터링
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(type);

-- 가격 범위 검색
CREATE INDEX IF NOT EXISTS idx_venues_price ON venues(price);

-- 방문일 정렬
CREATE INDEX IF NOT EXISTS idx_venues_visit_date ON venues(visit_date DESC NULLS LAST);

-- 생성일 정렬 (기본 정렬)
CREATE INDEX IF NOT EXISTS idx_venues_created_at ON venues(created_at DESC);

-- 복합 인덱스: 커플 + 상태 (자주 사용되는 필터 조합)
CREATE INDEX IF NOT EXISTS idx_venues_couple_status ON venues(couple_id, status);

-- =====================================================
-- EXPENSES 테이블 인덱스
-- =====================================================
-- 커플별 지출 조회
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON expenses(couple_id);

-- 카테고리별 필터링
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);

-- 날짜 범위 검색
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- 지불자별 필터링
CREATE INDEX IF NOT EXISTS idx_expenses_payer ON expenses(payer);

-- 금액 범위 검색
CREATE INDEX IF NOT EXISTS idx_expenses_amount ON expenses(amount);

-- 복합 인덱스: 커플 + 날짜 (가장 빈번한 조회 패턴)
CREATE INDEX IF NOT EXISTS idx_expenses_couple_date ON expenses(couple_id, date DESC);

-- 복합 인덱스: 커플 + 카테고리 (카테고리별 지출 조회)
CREATE INDEX IF NOT EXISTS idx_expenses_couple_category ON expenses(couple_id, category_id);

-- =====================================================
-- BUDGET_CATEGORIES 테이블 인덱스
-- =====================================================
-- 커플별 예산 카테고리 조회
CREATE INDEX IF NOT EXISTS idx_budget_categories_couple_id ON budget_categories(couple_id);

-- =====================================================
-- EVENTS 테이블 인덱스
-- =====================================================
-- 커플별 이벤트 조회
CREATE INDEX IF NOT EXISTS idx_events_couple_id ON events(couple_id);

-- 날짜 범위 검색 (캘린더 뷰)
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

-- 카테고리별 필터링
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);

-- 담당자별 필터링
CREATE INDEX IF NOT EXISTS idx_events_assigned_to ON events(assigned_to);

-- 복합 인덱스: 커플 + 날짜 범위 (월별 조회)
CREATE INDEX IF NOT EXISTS idx_events_couple_date ON events(couple_id, start_date);

-- 다가오는 일정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(couple_id, start_date) 
  WHERE start_date >= CURRENT_DATE;

-- =====================================================
-- CHECKLIST_ITEMS 테이블 인덱스
-- =====================================================
-- 커플별 체크리스트 조회
CREATE INDEX IF NOT EXISTS idx_checklist_items_couple_id ON checklist_items(couple_id);

-- 카테고리별 필터링
CREATE INDEX IF NOT EXISTS idx_checklist_items_category_id ON checklist_items(category_id);

-- 완료 상태 필터링
CREATE INDEX IF NOT EXISTS idx_checklist_items_completed ON checklist_items(is_completed);

-- 마감일 정렬
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_date ON checklist_items(due_date);

-- 기간별 필터링
CREATE INDEX IF NOT EXISTS idx_checklist_items_due_period ON checklist_items(due_period);

-- 담당자별 필터링
CREATE INDEX IF NOT EXISTS idx_checklist_items_assigned_to ON checklist_items(assigned_to);

-- 복합 인덱스: 커플 + 완료 상태 (미완료 항목 조회)
CREATE INDEX IF NOT EXISTS idx_checklist_items_couple_completed ON checklist_items(couple_id, is_completed);

-- 복합 인덱스: 커플 + 마감일 (기한 임박 항목 조회)
CREATE INDEX IF NOT EXISTS idx_checklist_items_couple_due ON checklist_items(couple_id, due_date) 
  WHERE is_completed = FALSE;

-- 지연된 항목 조회 최적화
CREATE INDEX IF NOT EXISTS idx_checklist_items_overdue ON checklist_items(couple_id, due_date) 
  WHERE is_completed = FALSE AND due_date < CURRENT_DATE;

-- =====================================================
-- CHECKLIST_CATEGORIES 테이블 인덱스
-- =====================================================
-- 커플별 카테고리 조회
CREATE INDEX IF NOT EXISTS idx_checklist_categories_couple_id ON checklist_categories(couple_id);

-- 정렬 순서
CREATE INDEX IF NOT EXISTS idx_checklist_categories_sort_order ON checklist_categories(couple_id, sort_order);

-- =====================================================
-- NOTIFICATIONS 테이블 인덱스 (이미 존재하지만 확인)
-- =====================================================
-- 사용자별 알림 조회
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 생성일 정렬
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 읽지 않은 알림 조회
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- 타입별 필터링
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- REFRESH_TOKENS 테이블 인덱스
-- =====================================================
-- 사용자별 토큰 조회
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- 토큰 해시로 조회
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 만료된 토큰 정리
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- =====================================================
-- LOGIN_HISTORY 테이블 인덱스
-- =====================================================
-- 사용자별 로그인 기록 조회
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);

-- 생성일 정렬
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);

-- =====================================================
-- PHOTO_REFERENCES 테이블 인덱스
-- =====================================================
-- 커플별 사진 조회
CREATE INDEX IF NOT EXISTS idx_photo_references_couple_id ON photo_references(couple_id);

-- 카테고리별 필터링
CREATE INDEX IF NOT EXISTS idx_photo_references_category ON photo_references(category);

-- =====================================================
-- ANNOUNCEMENTS 테이블 인덱스
-- =====================================================
-- 활성 공지사항 조회
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active) WHERE is_active = TRUE;

-- 생성일 정렬
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- 우선순위 정렬
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority DESC);

-- =====================================================
-- 코멘트 추가
-- =====================================================
COMMENT ON INDEX idx_users_email IS '이메일 기반 사용자 조회 최적화';
COMMENT ON INDEX idx_venues_couple_status IS '커플별 상태 필터링 최적화';
COMMENT ON INDEX idx_expenses_couple_date IS '커플별 날짜 범위 지출 조회 최적화';
COMMENT ON INDEX idx_events_couple_date IS '커플별 월간 일정 조회 최적화';
COMMENT ON INDEX idx_checklist_items_couple_completed IS '커플별 완료/미완료 체크리스트 조회 최적화';
