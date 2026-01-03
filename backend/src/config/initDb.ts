/**
 * Database Initialization Module
 * 
 * 서버 시작 시 실행되는 데이터베이스 마이그레이션 로직
 * index.ts에서 분리하여 코드 가독성 및 유지보수성 향상
 */

import { pool } from './database';

/**
 * 서버 시작 시 필요한 스키마 업데이트 실행
 * - 새 컬럼 추가 (IF NOT EXISTS)
 * - 새 테이블 생성 (IF NOT EXISTS)
 * - 인덱스 생성
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running migrations...');
    
    // 1. Users 테이블 확장
    await migrateUsersTable();
    
    // 2. Couples 테이블 확장
    await migrateCouplesTable();
    
    // 3. Couple Profiles 테이블
    await migrateCoupleProfilesTable();
    
    // 4. 알림 관련 테이블
    await migrateNotificationTables();
    
    // 5. 포토 레퍼런스 테이블
    await migratePhotoReferencesTable();
    
    // 6. 보안 관련 테이블 및 컬럼
    await migrateSecurityTables();
    
    // 7. 공지사항 테이블
    await migrateAnnouncementsTable();
    
    // 8. Venues 테이블 확장
    await migrateVenuesTable();
    
    // 9. Expenses 테이블 확장
    await migrateExpensesTable();
    
    // 10. Venue Contracts 테이블
    await migrateVenueContractsTable();
    
    // 11. 정리 작업
    await cleanupOldData();
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

/**
 * Users 테이블 마이그레이션
 */
async function migrateUsersTable(): Promise<void> {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
  `);
  
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS couple_id INTEGER REFERENCES couples(id) ON DELETE SET NULL
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_couple_id ON users(couple_id)`);
  
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)
  `);
  
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
}

/**
 * Couples 테이블 마이그레이션
 */
async function migrateCouplesTable(): Promise<void> {
  await pool.query(`
    ALTER TABLE couples ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
  
  await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS groom_name VARCHAR(100)`);
  await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS bride_name VARCHAR(100)`);
  await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_date DATE`);
  await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15, 2) DEFAULT 0`);
}


/**
 * Couple Profiles 테이블 마이그레이션
 */
async function migrateCoupleProfilesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS couple_profiles (
      id SERIAL PRIMARY KEY,
      couple_id INTEGER UNIQUE REFERENCES couples(id) ON DELETE CASCADE,
      groom_name VARCHAR(100),
      groom_image TEXT,
      groom_birth_date DATE,
      groom_contact VARCHAR(50),
      bride_name VARCHAR(100),
      bride_image TEXT,
      bride_birth_date DATE,
      bride_contact VARCHAR(50),
      couple_photo TEXT,
      first_met_date DATE,
      wedding_date DATE,
      couple_nickname VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await pool.query(`
    ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
  
  // 이미지 컬럼을 TEXT로 변경 (Base64 저장용)
  await pool.query(`
    ALTER TABLE couple_profiles ALTER COLUMN groom_image TYPE TEXT
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE couple_profiles ALTER COLUMN bride_image TYPE TEXT
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE couple_profiles ALTER COLUMN couple_photo TYPE TEXT
  `).catch(() => {});
}

/**
 * 알림 관련 테이블 마이그레이션
 */
async function migrateNotificationTables(): Promise<void> {
  // notifications 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data JSONB DEFAULT '{}',
      link VARCHAR(255),
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      read_at TIMESTAMP WITH TIME ZONE
    )
  `);
  
  // notification_preferences 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      dday_enabled BOOLEAN DEFAULT TRUE,
      dday_daily BOOLEAN DEFAULT FALSE,
      schedule_enabled BOOLEAN DEFAULT TRUE,
      checklist_enabled BOOLEAN DEFAULT TRUE,
      budget_enabled BOOLEAN DEFAULT TRUE,
      couple_enabled BOOLEAN DEFAULT TRUE,
      announcement_enabled BOOLEAN DEFAULT TRUE,
      push_enabled BOOLEAN DEFAULT TRUE,
      preferred_time TIME DEFAULT '09:00:00',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // push_subscriptions 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, endpoint)
    )
  `);
  
  // 인덱스
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
}

/**
 * 포토 레퍼런스 테이블 마이그레이션
 */
async function migratePhotoReferencesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS photo_references (
      id SERIAL PRIMARY KEY,
      couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'etc',
      title VARCHAR(200),
      memo TEXT,
      tags TEXT[],
      source_url VARCHAR(500),
      is_favorite BOOLEAN DEFAULT FALSE,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_photo_references_couple ON photo_references(couple_id)`);
}


/**
 * 보안 관련 테이블 및 컬럼 마이그레이션
 */
async function migrateSecurityTables(): Promise<void> {
  // 보안 관련 컬럼 추가
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP`);
  
  // 비밀번호 재설정 토큰 컬럼
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(10)`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP`);
  
  // 로그인 기록 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      ip_address VARCHAR(50),
      user_agent TEXT,
      success BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_login_history_created ON login_history(created_at DESC)`);
  
  // Refresh Token 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      revoked BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash)`);
}

/**
 * 공지사항 테이블 마이그레이션
 */
async function migrateAnnouncementsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'notice',
      priority INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_date TIMESTAMP,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, start_date, end_date)`);
}

/**
 * Venues 테이블 확장 마이그레이션
 */
async function migrateVenuesTable(): Promise<void> {
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS meal_cost_per_person BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS sdm_included BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS studio_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS dress_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS makeup_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS bouquet_included BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS bouquet_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS rehearsal_makeup_included BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS rehearsal_makeup_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS extra_fitting_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS wedding_robe_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS outdoor_venue_fee BIGINT DEFAULT 0`);
  await pool.query(`ALTER TABLE venues ADD COLUMN IF NOT EXISTS fresh_flower_fee BIGINT DEFAULT 0`);
}


/**
 * Expenses 테이블 확장 마이그레이션
 */
async function migrateExpensesTable(): Promise<void> {
  // 결제 상태 컬럼 추가 (completed: 결제완료, planned: 결제예정)
  await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed'`);
  
  // 결제 예정일 컬럼 추가
  await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS due_date DATE`);
  
  // 인덱스 추가
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date)`);
}

/**
 * Venue Contracts 테이블 마이그레이션
 */
async function migrateVenueContractsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS venue_contracts (
      id SERIAL PRIMARY KEY,
      venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      couple_id INTEGER NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
      event_datetime TIMESTAMP WITH TIME ZONE,
      event_datetime_memo TEXT,
      event_location VARCHAR(200),
      event_location_memo TEXT,
      reception_hall VARCHAR(200),
      reception_hall_memo TEXT,
      guaranteed_guests INTEGER DEFAULT 0,
      guaranteed_guests_memo TEXT,
      meal_ticket_count INTEGER DEFAULT 0,
      meal_ticket_memo TEXT,
      groom_name VARCHAR(100),
      groom_contact VARCHAR(50),
      bride_name VARCHAR(100),
      bride_contact VARCHAR(50),
      couple_info_memo TEXT,
      meal_course_name VARCHAR(200),
      meal_course_price BIGINT DEFAULT 0,
      meal_total_price BIGINT DEFAULT 0,
      meal_course_memo TEXT,
      alcohol_service_included BOOLEAN DEFAULT FALSE,
      alcohol_service_price BIGINT DEFAULT 0,
      alcohol_service_memo TEXT,
      hall_rental_fee BIGINT DEFAULT 0,
      hall_rental_fee_memo TEXT,
      hall_rental_fee_status VARCHAR(20) DEFAULT 'pending',
      wedding_supplies TEXT,
      wedding_supplies_fee BIGINT DEFAULT 0,
      wedding_supplies_memo TEXT,
      wedding_supplies_status VARCHAR(20) DEFAULT 'pending',
      equipment_lighting BOOLEAN DEFAULT FALSE,
      equipment_lighting_fee BIGINT DEFAULT 0,
      equipment_lighting_memo TEXT,
      equipment_video BOOLEAN DEFAULT FALSE,
      equipment_video_fee BIGINT DEFAULT 0,
      equipment_video_memo TEXT,
      equipment_bgm BOOLEAN DEFAULT FALSE,
      equipment_bgm_fee BIGINT DEFAULT 0,
      equipment_bgm_memo TEXT,
      equipment_confetti BOOLEAN DEFAULT FALSE,
      equipment_confetti_fee BIGINT DEFAULT 0,
      equipment_confetti_memo TEXT,
      equipment_status VARCHAR(20) DEFAULT 'pending',
      pyebaek_included BOOLEAN DEFAULT FALSE,
      pyebaek_fee BIGINT DEFAULT 0,
      pyebaek_memo TEXT,
      pyebaek_status VARCHAR(20) DEFAULT 'pending',
      benefit_hotel_room BOOLEAN DEFAULT FALSE,
      benefit_hotel_room_memo TEXT,
      benefit_meals BOOLEAN DEFAULT FALSE,
      benefit_meals_memo TEXT,
      benefit_wedding_cake BOOLEAN DEFAULT FALSE,
      benefit_wedding_cake_memo TEXT,
      benefit_other TEXT,
      deposit_amount BIGINT DEFAULT 0,
      deposit_paid BOOLEAN DEFAULT FALSE,
      deposit_paid_date DATE,
      deposit_memo TEXT,
      date_change_condition TEXT,
      cancellation_penalty TEXT,
      contract_memo TEXT,
      total_contract_amount BIGINT DEFAULT 0,
      total_paid_amount BIGINT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(venue_id)
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_venue_contracts_venue ON venue_contracts(venue_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_venue_contracts_couple ON venue_contracts(couple_id)`);
  
  // venue_contract_expenses 테이블
  await pool.query(`
    CREATE TABLE IF NOT EXISTS venue_contract_expenses (
      id SERIAL PRIMARY KEY,
      contract_id INTEGER NOT NULL REFERENCES venue_contracts(id) ON DELETE CASCADE,
      expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
      expense_type VARCHAR(50) NOT NULL,
      amount BIGINT DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending',
      due_date DATE,
      paid_date DATE,
      memo TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_venue_contract_expenses_contract ON venue_contract_expenses(contract_id)`);
}

/**
 * 오래된 데이터 정리
 */
async function cleanupOldData(): Promise<void> {
  // 오래된 로그인 기록 삭제 (90일 이상)
  await pool.query(`DELETE FROM login_history WHERE created_at < NOW() - INTERVAL '90 days'`).catch(() => {});
  
  // 만료된 refresh token 삭제
  await pool.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`).catch(() => {});
}
