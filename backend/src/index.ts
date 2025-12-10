import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { pool } from './config/database';

import authRoutes from './routes/auth';
import coupleRoutes from './routes/couple';
import coupleProfileRoutes from './routes/coupleProfile';
import venueRoutes from './routes/venues';
import budgetRoutes from './routes/budget';
import expenseRoutes from './routes/expenses';
import statsRoutes from './routes/stats';
import checklistRoutes from './routes/checklist';
import eventRoutes from './routes/events';
import adminRoutes from './routes/admin';
import notificationRoutes from './routes/notifications';
import pushRoutes from './routes/push';
import photoReferenceRoutes from './routes/photoReferences';
import { initSentry, sentryErrorHandler } from './lib/sentry';
import { securityHeaders, validateRequestBody } from './middleware/security';
import { apiRateLimiter } from './middleware/rateLimiter';

dotenv.config();

// Sentry 초기화 (가장 먼저)
initSentry();

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 헤더 적용 (가장 먼저)
app.use(securityHeaders);

// Middleware - CORS 설정
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'https://wedding-budget-app.vercel.app',
  'https://wedding-budget-app-2.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    // 개발 환경이거나 허용된 origin인 경우
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24시간
}));

// Preflight 요청 처리
app.options('*', cors());

// API Rate Limiter
app.use('/api', apiRateLimiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 요청 본문 검증 (SQL Injection 방지)
app.use(validateRequestBody);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/couple', coupleProfileRoutes);  // profile 라우트 먼저
app.use('/api/couple', coupleRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/photo-references', photoReferenceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  
  // Sentry에 에러 전송
  sentryErrorHandler()(err, req, res, () => {});
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// 서버 시작 시 마이그레이션 실행
const runMigrations = async () => {
  try {
    console.log('Running migrations...');
    
    // users 테이블에 is_admin 컬럼 추가 (없으면)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
    `);
    
    // users 테이블에 couple_id 컬럼 추가 (없으면)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS couple_id INTEGER REFERENCES couples(id) ON DELETE SET NULL
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_couple_id ON users(couple_id)`);
    
    // users 테이블에 role 컬럼 추가 (없으면)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20)
    `);
    
    // users 테이블에 updated_at 컬럼 추가 (없으면)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    // couples 테이블에 updated_at 컬럼 추가 (없으면)
    await pool.query(`
      ALTER TABLE couples ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    // couples 테이블에 groom_name, bride_name 등 컬럼 추가 (없으면)
    await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS groom_name VARCHAR(100)`);
    await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS bride_name VARCHAR(100)`);
    await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS wedding_date DATE`);
    await pool.query(`ALTER TABLE couples ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15, 2) DEFAULT 0`);
    
    // couple_profiles 테이블 생성 (없으면)
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
    
    // couple_profiles 테이블에 updated_at 컬럼 추가 (없으면)
    await pool.query(`
      ALTER TABLE couple_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    
    // couple_profiles 이미지 컬럼을 TEXT로 변경 (Base64 저장용)
    await pool.query(`
      ALTER TABLE couple_profiles ALTER COLUMN groom_image TYPE TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE couple_profiles ALTER COLUMN bride_image TYPE TEXT
    `).catch(() => {});
    await pool.query(`
      ALTER TABLE couple_profiles ALTER COLUMN couple_photo TYPE TEXT
    `).catch(() => {});
    
    // notifications 테이블 생성
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
    
    // notification_preferences 테이블 생성
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
    
    // push_subscriptions 테이블 생성
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
    
    // 인덱스 생성
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`);
    
    // photo_references 테이블 생성 (스냅 촬영 레퍼런스)
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
    
    // 보안 관련 컬럼 추가
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP`);
    
    // 비밀번호 재설정 토큰 컬럼 추가
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
    
    // Refresh Token 테이블 (토큰 관리용)
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
    
    // 오래된 로그인 기록 자동 삭제 (90일 이상)
    await pool.query(`DELETE FROM login_history WHERE created_at < NOW() - INTERVAL '90 days'`).catch(() => {});
    
    // 만료된 refresh token 삭제
    await pool.query(`DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE`).catch(() => {});
    
    // announcements 테이블 생성 (공지사항)
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
    
    // venues 테이블에 추가 비용 컬럼 추가
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
    
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  }
};

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // 마이그레이션 실행
  await runMigrations();
});
