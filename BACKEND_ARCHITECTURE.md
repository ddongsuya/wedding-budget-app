# 백엔드 아키텍처 상세 문서

## 📋 목차
1. [디렉토리 구조](#디렉토리-구조)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [API 엔드포인트](#api-엔드포인트)
4. [인증 플로우](#인증-플로우)
5. [파일 업로드](#파일-업로드)

---

## 디렉토리 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # PostgreSQL 연결 설정
│   │   └── migrate.ts           # 데이터베이스 마이그레이션 스크립트
│   │
│   ├── controllers/             # 비즈니스 로직
│   │   ├── authController.ts           # 인증 (회원가입, 로그인)
│   │   ├── coupleController.ts         # 커플 연결
│   │   ├── coupleProfileController.ts  # 커플 프로필
│   │   ├── budgetController.ts         # 예산 설정
│   │   ├── expenseController.ts        # 지출 관리
│   │   ├── venueController.ts          # 식장 관리
│   │   └── statsController.ts          # 통계
│   │
│   ├── middleware/
│   │   ├── auth.ts              # JWT 인증 미들웨어
│   │   └── validation.ts        # 입력값 검증
│   │
│   ├── routes/                  # API 라우트 정의
│   │   ├── auth.ts
│   │   ├── couple.ts
│   │   ├── coupleProfile.ts
│   │   ├── budget.ts
│   │   ├── expenses.ts
│   │   ├── venues.ts
│   │   └── stats.ts
│   │
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   │
│   ├── utils/
│   │   ├── jwt.ts               # JWT 토큰 생성/검증
│   │   └── upload.ts            # 파일 업로드 및 이미지 최적화
│   │
│   └── index.ts                 # Express 서버 진입점
│
├── uploads/                     # 업로드된 파일 저장
├── .env                         # 환경 변수 (Git 제외)
├── package.json
└── tsconfig.json
```

---

## 데이터베이스 스키마

### 1. users (사용자)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,      -- bcrypt 해싱
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. couples (커플)
```sql
CREATE TABLE couples (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(50) UNIQUE,      -- 파트너 초대 코드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. couple_profiles (커플 프로필)
```sql
CREATE TABLE couple_profiles (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER UNIQUE REFERENCES couples(id),
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
```

### 4. budget_settings (예산 설정)
```sql
CREATE TABLE budget_settings (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER UNIQUE REFERENCES couples(id),
  total_budget BIGINT DEFAULT 0,
  groom_ratio INTEGER DEFAULT 50,      -- 신랑 분담 비율
  bride_ratio INTEGER DEFAULT 50,      -- 신부 분담 비율
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. budget_categories (예산 카테고리)
```sql
CREATE TABLE budget_categories (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  parent_id INTEGER REFERENCES budget_categories(id),
  budget_amount BIGINT DEFAULT 0,
  color VARCHAR(20),
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. venues (식장)
```sql
CREATE TABLE venues (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id),
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
  images TEXT[],                       -- 이미지 URL 배열
  status VARCHAR(20) DEFAULT 'considering',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7. expenses (지출)
```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  couple_id INTEGER REFERENCES couples(id),
  category_id INTEGER REFERENCES budget_categories(id),
  title VARCHAR(200) NOT NULL,
  amount BIGINT NOT NULL,
  date DATE NOT NULL,
  payer VARCHAR(20) NOT NULL,          -- 'groom' or 'bride'
  payment_method VARCHAR(50),
  vendor VARCHAR(200),
  notes TEXT,
  receipt_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스
```sql
CREATE INDEX idx_couples_user1 ON couples(user1_id);
CREATE INDEX idx_couples_user2 ON couples(user2_id);
CREATE INDEX idx_couples_invite ON couples(invite_code);
CREATE INDEX idx_venues_couple ON venues(couple_id);
CREATE INDEX idx_expenses_couple ON expenses(couple_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_budget_categories_couple ON budget_categories(couple_id);
```

---

## API 엔드포인트

### 인증 (Auth)
```
POST   /api/auth/register      # 회원가입
POST   /api/auth/login         # 로그인
POST   /api/auth/refresh       # 토큰 갱신
GET    /api/auth/me            # 현재 사용자 정보
```

### 커플 (Couple)
```
POST   /api/couple/invite      # 초대 코드 생성
POST   /api/couple/join        # 초대 코드로 연결
GET    /api/couple             # 커플 정보 조회
GET    /api/couple/profile     # 프로필 조회
PUT    /api/couple/profile     # 프로필 수정
POST   /api/couple/profile/groom-image   # 신랑 사진 업로드
POST   /api/couple/profile/bride-image   # 신부 사진 업로드
POST   /api/couple/profile/couple-image  # 커플 사진 업로드
```

### 예산 (Budget)
```
GET    /api/budget                    # 예산 설정 조회
PUT    /api/budget                    # 예산 설정 수정
GET    /api/budget/categories         # 카테고리 목록
POST   /api/budget/categories         # 카테고리 추가
PUT    /api/budget/categories/:id     # 카테고리 수정
```

### 지출 (Expenses)
```
GET    /api/expenses           # 목록 조회 (필터/정렬/페이지네이션)
POST   /api/expenses           # 추가
GET    /api/expenses/:id       # 상세 조회
PUT    /api/expenses/:id       # 수정
DELETE /api/expenses/:id       # 삭제
POST   /api/expenses/:id/receipt  # 영수증 업로드
```

### 식장 (Venues)
```
GET    /api/venues             # 목록 조회 (필터/정렬/페이지네이션)
POST   /api/venues             # 추가
GET    /api/venues/:id         # 상세 조회
PUT    /api/venues/:id         # 수정
DELETE /api/venues/:id         # 삭제
```

### 통계 (Stats)
```
GET    /api/stats/summary      # 전체 요약
GET    /api/stats/by-category  # 카테고리별 통계
GET    /api/stats/by-month     # 월별 통계
GET    /api/stats/by-payer     # 신랑/신부별 통계
```

---

**다음 문서**: [프론트엔드 상세 구조](FRONTEND_ARCHITECTURE.md)
