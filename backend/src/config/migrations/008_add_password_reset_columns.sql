-- 비밀번호 재설정 토큰 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
