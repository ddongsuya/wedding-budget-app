-- Venue Contract Fields Migration
-- 식장 계약 정보 필드 추가

-- 계약 정보 JSONB 컬럼 추가 (모든 계약 관련 정보를 하나의 JSON으로 저장)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS contract_info JSONB DEFAULT NULL;

-- 인덱스 추가 (계약된 식장 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_venues_contract_status ON venues(status) WHERE status = 'contracted';

-- 코멘트 추가
COMMENT ON COLUMN venues.contract_info IS '계약 정보 (행사일시, 피로연장, 식사보증인원, 신랑/신부 정보, 식사코스, 주류서비스, 홀대관료, 혼구용품, 식권, 예식장비, 폐백, 특전 등)';
