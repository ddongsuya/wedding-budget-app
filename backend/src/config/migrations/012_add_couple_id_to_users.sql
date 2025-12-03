-- Create couples table if not exists
CREATE TABLE IF NOT EXISTS couples (
  id SERIAL PRIMARY KEY,
  invite_code VARCHAR(10) UNIQUE,
  groom_name VARCHAR(100),
  bride_name VARCHAR(100),
  wedding_date DATE,
  total_budget DECIMAL(15, 2) DEFAULT 0,
  groom_image_url VARCHAR(500),
  bride_image_url VARCHAR(500),
  couple_image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add couple_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS couple_id INTEGER REFERENCES couples(id) ON DELETE SET NULL;

-- Add is_admin column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_couple_id ON users(couple_id);
