-- Photo References Table Migration
-- 포토 레퍼런스 테이블 생성

-- Create photo_references table
CREATE TABLE IF NOT EXISTS photo_references (
    id SERIAL PRIMARY KEY,
    couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'etc',
    title VARCHAR(200) DEFAULT '',
    memo TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    source_url TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_photo_references_couple_id ON photo_references(couple_id);
CREATE INDEX IF NOT EXISTS idx_photo_references_category ON photo_references(category);
CREATE INDEX IF NOT EXISTS idx_photo_references_is_favorite ON photo_references(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photo_references_created_at ON photo_references(created_at DESC);

-- Add comment
COMMENT ON TABLE photo_references IS '웨딩 스냅 촬영 참고 사진 저장 테이블';
