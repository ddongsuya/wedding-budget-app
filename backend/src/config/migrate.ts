import { pool } from './database';

const migrations = `
-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Couples 테이블
CREATE TABLE IF NOT EXISTS couples (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_couple UNIQUE(user1_id, user2_id)
);

-- CoupleProfiles 테이블
CREATE TABLE IF NOT EXISTS couple_profiles (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER UNIQUE REFERENCES couples(id) ON DELETE CASCADE,
  groom_name VARCHAR(100),
  groom_image VARCHAR(500),
  groom_birth_date DATE,
  groom_contact VARCHAR(50),
  bride_name VARCHAR(100),
  bride_image VARCHAR(500),
  bride_birth_date DATE,
  bride_contact VARCHAR(50),
  couple_photo VARCHAR(500),
  first_met_date DATE,
  wedding_date DATE,
  couple_nickname VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BudgetSettings 테이블
CREATE TABLE IF NOT EXISTS budget_settings (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER UNIQUE REFERENCES couples(id) ON DELETE CASCADE,
  total_budget BIGINT DEFAULT 0,
  groom_ratio INTEGER DEFAULT 50,
  bride_ratio INTEGER DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BudgetCategories 테이블
CREATE TABLE IF NOT EXISTS budget_categories (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  parent_id INTEGER REFERENCES budget_categories(id) ON DELETE CASCADE,
  budget_amount BIGINT DEFAULT 0,
  color VARCHAR(20),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Venues 테이블
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50),
  location VARCHAR(500),
  contact VARCHAR(50),
  price BIGINT,
  capacity INTEGER,
  visit_date DATE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  pros TEXT,
  cons TEXT,
  notes TEXT,
  images TEXT[],
  status VARCHAR(20) DEFAULT 'considering',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses 테이블
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES budget_categories(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  amount BIGINT NOT NULL,
  date DATE NOT NULL,
  payer VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50),
  vendor VARCHAR(200),
  notes TEXT,
  receipt_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_couples_user1 ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2 ON couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_couples_invite ON couples(invite_code);
CREATE INDEX IF NOT EXISTS idx_venues_couple ON venues(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_couple ON expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_budget_categories_couple ON budget_categories(couple_id);
`;

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await pool.query(migrations);
    console.log('Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
