-- couples 테이블에 초대 코드 추가
ALTER TABLE couples ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE;

-- 초대 코드 인덱스
CREATE INDEX IF NOT EXISTS idx_couples_invite_code ON couples(invite_code);

-- users 테이블에 role 추가 (이미 couple_id는 있음)
ALTER TABLE couples ADD COLUMN IF NOT EXISTS groom_name VARCHAR(100);
ALTER TABLE couples ADD COLUMN IF NOT EXISTS bride_name VARCHAR(100);
ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_date DATE;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE couples ADD COLUMN IF NOT EXISTS groom_image_url VARCHAR(500);
ALTER TABLE couples ADD COLUMN IF NOT EXISTS bride_image_url VARCHAR(500);
ALTER TABLE couples ADD COLUMN IF NOT EXISTS couple_image_url VARCHAR(500);

-- 기존 couples에 초대 코드 생성 (없는 경우)
UPDATE couples 
SET invite_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6))
WHERE invite_code IS NULL;

-- invite_code를 NOT NULL로 변경
ALTER TABLE couples ALTER COLUMN invite_code SET NOT NULL;
