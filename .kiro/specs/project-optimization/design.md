# Design Document

## Overview

이 프로젝트는 Needless Wedding 웹 애플리케이션의 전반적인 품질을 향상시키기 위한 종합 최적화 작업입니다. 코드 품질, 성능, UI/UX, 보안의 4가지 핵심 영역을 체계적으로 개선합니다.

현재 애플리케이션은 React + TypeScript 프론트엔드와 Express.js + PostgreSQL 백엔드로 구성되어 있으며, Vercel(프론트엔드)과 Render(백엔드)에 배포되어 있습니다.

## Architecture

### 현재 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vercel)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React + TypeScript + Vite                          │   │
│  │  - pages/: 페이지 컴포넌트                           │   │
│  │  - components/: 재사용 컴포넌트                      │   │
│  │  - src/api/: API 클라이언트                         │   │
│  │  - src/contexts/: React Context                     │   │
│  │  - src/hooks/: Custom Hooks                         │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Render)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                            │   │
│  │  - routes/: API 라우트                              │   │
│  │  - controllers/: 비즈니스 로직                       │   │
│  │  - middleware/: 인증, 검증, 보안                     │   │
│  │  - services/: 서비스 레이어                          │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Neon.tech)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL                                         │   │
│  │  - users, couples, venues, expenses, etc.           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 최적화 후 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vercel)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React + TypeScript + Vite                          │   │
│  │  + Code Splitting (React.lazy)                      │   │
│  │  + Image Optimization (WebP, lazy loading)          │   │
│  │  + Service Worker (PWA)                             │   │
│  │  + Error Boundary + Sentry                          │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS + Security Headers
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Render)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express.js + TypeScript                            │   │
│  │  + Helmet (Security Headers)                        │   │
│  │  + Rate Limiting (express-rate-limit)               │   │
│  │  + Input Validation (express-validator)             │   │
│  │  + CORS Configuration                               │   │
│  │  + HTTP-only Cookies                                │   │
│  │  + Sentry Error Tracking                            │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │ Connection Pooling
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (Neon.tech)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL                                         │   │
│  │  + Optimized Indexes                                │   │
│  │  + Query Optimization                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. 보안 미들웨어 (Backend)

#### Security Middleware (`backend/src/middleware/security.ts`)

```typescript
// Helmet 설정 - 보안 헤더 추가
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS 설정
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

#### Rate Limiter (`backend/src/middleware/rateLimiter.ts`)

```typescript
// 일반 API Rate Limiting
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // 분당 100 요청
  message: { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

// 로그인 Rate Limiting
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 15분당 5회
  message: { success: false, message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.' },
});
```

### 2. 입력 검증 (Backend)

#### Validation Middleware (`backend/src/middleware/validation.ts`)

```typescript
import { body, param, query, validationResult } from 'express-validator';

// 공통 검증 규칙
export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('유효한 이메일 주소를 입력해주세요');

export const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('비밀번호는 최소 8자 이상이어야 합니다');

// 검증 결과 처리
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다',
      errors: errors.array(),
    });
  }
  next();
};
```

### 3. 프론트엔드 최적화

#### Code Splitting (`App.tsx`)

```typescript
import { lazy, Suspense } from 'react';
import { LoadingScreen } from './src/components/common/LoadingScreen';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Venues = lazy(() => import('./pages/Venues'));
const Budget = lazy(() => import('./pages/Budget'));
const Schedule = lazy(() => import('./pages/Schedule'));
const AdminDashboard = lazy(() => import('./src/pages/AdminDashboard'));

// Route with Suspense
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* ... */}
  </Routes>
</Suspense>
```

#### Image Optimization (`src/utils/imageOptimizer.ts`)

```typescript
export const optimizeImage = async (file: File): Promise<Blob> => {
  // WebP 변환 및 리사이징
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = await createImageBitmap(file);
  
  // 최대 크기 제한
  const maxSize = 1920;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.85);
  });
};
```

### 4. 에러 처리

#### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// 일관된 에러 응답
export const sendError = (res: Response, status: number, message: string, code?: string) => {
  res.status(status).json({
    success: false,
    message,
    code,
  });
};
```

#### Frontend Error Boundary

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Sentry에 에러 보고
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## Data Models

### 기존 테이블 인덱스 최적화

```sql
-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_couple_id ON users(couple_id);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- venues 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_venues_couple_id ON venues(couple_id);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

-- expenses 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_expenses_couple_id ON expenses(couple_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- events 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_events_couple_id ON events(couple_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- checklist_items 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_checklist_items_couple_id ON checklist_items(couple_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category);
CREATE INDEX IF NOT EXISTS idx_checklist_items_completed ON checklist_items(completed);
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Error Response Consistency
*For any* API endpoint that encounters an error, the response should be a valid JSON object with `success: false` and a `message` field, never an unhandled exception or HTML error page.
**Validates: Requirements 1.4, 10.4**

### Property 2: Pagination Metadata Accuracy
*For any* paginated API endpoint with parameters `page` and `limit`, the response should include `totalPages = ceil(total / limit)` and the number of returned items should be `<= limit`.
**Validates: Requirements 3.5**

### Property 3: JWT Expiration Validity
*For any* issued JWT access token, the `exp` claim should be set to a time no more than 24 hours from the `iat` (issued at) time.
**Validates: Requirements 7.2**

### Property 4: Password Hash Security
*For any* stored password hash, it should be a valid bcrypt hash with a cost factor of at least 10.
**Validates: Requirements 7.5**

### Property 5: Security Headers Presence
*For any* API response, the headers should include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `X-XSS-Protection: 1; mode=block`.
**Validates: Requirements 8.3**

### Property 6: CORS Origin Validation
*For any* API request from an origin not in the allowed list, the response should not include `Access-Control-Allow-Origin` header for that origin.
**Validates: Requirements 8.4**

### Property 7: Input Validation Rejection
*For any* API endpoint receiving malformed or invalid input (e.g., invalid email format, missing required fields), the response should be a 400 status with validation error details.
**Validates: Requirements 8.1**

### Property 8: HTTP-only Cookie Flag
*For any* authentication cookie set by the server, the `HttpOnly` flag should be true to prevent JavaScript access.
**Validates: Requirements 7.1**

## Error Handling

### Backend Error Handling Strategy

1. **Global Error Handler**
```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Sentry에 에러 보고
  Sentry.captureException(err);
  
  // 프로덕션에서는 상세 에러 숨김
  const message = process.env.NODE_ENV === 'production' 
    ? '서버 오류가 발생했습니다' 
    : err.message;
  
  res.status(500).json({
    success: false,
    message,
  });
});
```

2. **Database Error Handling**
```typescript
try {
  const result = await pool.query(query, params);
  return result.rows;
} catch (error) {
  if (error.code === '23505') {
    throw new ConflictError('이미 존재하는 데이터입니다');
  }
  if (error.code === '23503') {
    throw new NotFoundError('참조하는 데이터가 존재하지 않습니다');
  }
  throw error;
}
```

### Frontend Error Handling Strategy

1. **API Error Handling**
```typescript
try {
  const response = await api.get('/endpoint');
  return response.data;
} catch (error) {
  if (error.response?.status === 401) {
    // 인증 만료 - 로그아웃 처리
    logout();
  } else if (error.response?.status === 403) {
    toast.error('접근 권한이 없습니다');
  } else {
    toast.error(error.response?.data?.message || '오류가 발생했습니다');
  }
  throw error;
}
```

2. **Error Boundary**
- 컴포넌트 트리의 최상위에 ErrorBoundary 배치
- 에러 발생 시 사용자 친화적인 에러 페이지 표시
- Sentry에 에러 자동 보고

## Testing Strategy

### Property-Based Testing

fast-check 라이브러리를 사용하여 correctness properties를 검증합니다.

```typescript
import fc from 'fast-check';

// Property 1: API Error Response Consistency
describe('API Error Response', () => {
  it('should always return consistent error format', () => {
    fc.assert(
      fc.property(fc.string(), (invalidInput) => {
        // API 호출 및 에러 응답 검증
        const response = callApiWithInvalidInput(invalidInput);
        expect(response.success).toBe(false);
        expect(response.message).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});

// Property 3: JWT Expiration Validity
describe('JWT Token', () => {
  it('should have expiration within 24 hours', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (userId) => {
        const token = generateToken({ id: userId });
        const decoded = jwt.decode(token);
        const maxExpiration = decoded.iat + (24 * 60 * 60);
        expect(decoded.exp).toBeLessThanOrEqual(maxExpiration);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

- 각 미들웨어 함수 테스트
- 컨트롤러 함수 테스트
- 유틸리티 함수 테스트

### Integration Testing

- API 엔드포인트 통합 테스트
- 인증 플로우 테스트
- 데이터베이스 쿼리 테스트

## Security Considerations

### 1. 인증 보안
- JWT 토큰을 HTTP-only 쿠키에 저장
- Access Token 만료 시간: 1시간
- Refresh Token 만료 시간: 7일
- Refresh Token Rotation 구현

### 2. API 보안
- Helmet으로 보안 헤더 설정
- CORS 화이트리스트 설정
- Rate Limiting 적용
- 입력 검증 및 sanitization

### 3. 데이터 보안
- 비밀번호 bcrypt 해싱 (cost factor 10)
- SQL Injection 방지 (parameterized queries)
- XSS 방지 (입력 sanitization)

### 4. 에러 처리
- 프로덕션에서 스택 트레이스 숨김
- 일관된 에러 응답 포맷
- Sentry 에러 모니터링

## Performance Considerations

### 1. 프론트엔드 최적화
- Code Splitting으로 초기 번들 크기 감소
- 이미지 WebP 변환 및 lazy loading
- React.memo, useMemo, useCallback 활용
- Service Worker 캐싱 (PWA)

### 2. 백엔드 최적화
- 데이터베이스 인덱스 최적화
- Connection Pooling
- 쿼리 최적화 (N+1 문제 해결)
- 응답 압축 (gzip)

### 3. 네트워크 최적화
- API 응답 캐싱
- 이미지 CDN 활용
- HTTP/2 지원

