import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { testConnection, getPoolStats } from './config/database';

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
import venueContractRoutes from './routes/venueContracts';
import { initSentry } from './lib/sentry';
import { securityHeaders, validateRequestBody, corsOptions } from './middleware/security';
import { apiRateLimiter } from './middleware/rateLimiter';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';
import { runMigrations } from './config/initDb';

dotenv.config();

// Sentry 초기화 (가장 먼저)
initSentry();

const app = express();
const PORT = process.env.PORT || 3000;

// 보안 헤더 적용 (가장 먼저)
app.use(securityHeaders);

// 응답 압축 (gzip) - Requirements 3.1
app.use(compression({
  filter: (req, res) => {
    // 이미 압축된 응답이나 SSE는 압축하지 않음
    if (req.headers['x-no-compression']) {
      return false;
    }
    // 기본 필터 사용 (text, json, javascript 등 압축)
    return compression.filter(req, res);
  },
  level: 6, // 압축 레벨 (1-9, 6이 기본값으로 속도와 압축률의 균형)
  threshold: 1024, // 1KB 이상인 응답만 압축
}));

// Middleware - CORS 설정 강화 (Requirements 8.4)
app.use(cors(corsOptions));

// Preflight 요청 처리
app.options('*', cors(corsOptions));

// Cookie parser for HTTP-only cookie authentication (Requirements 7.1)
app.use(cookieParser());

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
app.use('/api/venue-contracts', venueContractRoutes);

// Health check
app.get('/health', async (req, res) => {
  const poolStats = getPoolStats();
  res.json({ 
    status: poolStats.isConnected ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      connected: poolStats.isConnected,
      totalConnections: poolStats.totalCount,
      idleConnections: poolStats.idleCount,
      waitingRequests: poolStats.waitingCount,
    }
  });
});

// Global error handling middleware (Requirements 10.4)
app.use(globalErrorHandler);

// 404 handler for undefined routes
app.use(notFoundHandler);

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Warning: Database connection failed on startup');
  }
  
  // 마이그레이션 실행
  await runMigrations();
});
