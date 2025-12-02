# 결혼 예산 관리 API

Node.js + Express + PostgreSQL + TypeScript로 구현된 결혼 예산 관리 백엔드 API입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
`.env.example`을 복사하여 `.env` 파일을 생성하고 필요한 값을 설정합니다.

```bash
cp .env.example .env
```

### 3. PostgreSQL 데이터베이스 생성
```bash
createdb wedding_budget
```

### 4. 데이터베이스 마이그레이션
```bash
npm run migrate
```

### 5. 개발 서버 실행
```bash
npm run dev
```

서버가 http://localhost:3000 에서 실행됩니다.

## API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 현재 사용자 정보

### 커플 (Couple)
- `POST /api/couple/invite` - 파트너 초대 코드 생성
- `POST /api/couple/join` - 초대 코드로 연결
- `GET /api/couple` - 커플 정보 조회

### 커플 프로필 (Couple Profile)
- `GET /api/couple/profile` - 프로필 조회
- `PUT /api/couple/profile` - 프로필 수정
- `POST /api/couple/profile/groom-image` - 신랑 사진 업로드
- `POST /api/couple/profile/bride-image` - 신부 사진 업로드
- `POST /api/couple/profile/couple-image` - 커플 사진 업로드

### 식장 (Venues)
- `GET /api/venues` - 목록 조회 (필터/정렬/페이지네이션)
- `POST /api/venues` - 추가
- `GET /api/venues/:id` - 상세 조회
- `PUT /api/venues/:id` - 수정
- `DELETE /api/venues/:id` - 삭제

### 예산 설정 (Budget)
- `GET /api/budget` - 예산 설정 조회
- `PUT /api/budget` - 예산 설정 수정
- `GET /api/budget/categories` - 카테고리 목록
- `POST /api/budget/categories` - 카테고리 추가
- `PUT /api/budget/categories/:id` - 카테고리 수정

### 지출 (Expenses)
- `GET /api/expenses` - 목록 조회 (필터/정렬/페이지네이션)
- `POST /api/expenses` - 추가
- `GET /api/expenses/:id` - 상세 조회
- `PUT /api/expenses/:id` - 수정
- `DELETE /api/expenses/:id` - 삭제
- `POST /api/expenses/:id/receipt` - 영수증 이미지 업로드

### 통계 (Stats)
- `GET /api/stats/summary` - 전체 요약
- `GET /api/stats/by-category` - 카테고리별 통계
- `GET /api/stats/by-month` - 월별 통계
- `GET /api/stats/by-payer` - 신랑/신부별 통계

## 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts       # PostgreSQL 연결 설정
│   │   └── migrate.ts        # 데이터베이스 마이그레이션
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── coupleController.ts
│   │   ├── coupleProfileController.ts
│   │   ├── venueController.ts
│   │   ├── budgetController.ts
│   │   ├── expenseController.ts
│   │   └── statsController.ts
│   ├── middleware/
│   │   ├── auth.ts           # JWT 인증
│   │   └── validation.ts     # 입력값 검증
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── couple.ts
│   │   ├── coupleProfile.ts
│   │   ├── venues.ts
│   │   ├── budget.ts
│   │   ├── expenses.ts
│   │   └── stats.ts
│   ├── types/
│   │   └── index.ts          # TypeScript 타입 정의
│   ├── utils/
│   │   ├── jwt.ts            # JWT 토큰 생성/검증
│   │   └── upload.ts         # 파일 업로드 및 이미지 최적화
│   └── index.ts              # 진입점
├── uploads/                  # 업로드된 파일
├── api-examples.http         # API 테스트 예제
├── .env.example              # 환경 변수 예제
└── package.json
```

## 주요 기능

### 인증 및 보안
- JWT 기반 액세스/리프레시 토큰
- bcrypt 비밀번호 해싱
- 커플 단위 데이터 격리

### 데이터 관리
- 페이지네이션 지원
- 정렬 및 필터링
- 이미지 업로드 및 최적화 (Sharp)

### 통계 및 분석
- 실시간 예산 사용률 계산
- 카테고리별/월별/분담자별 통계
- 예산 대비 지출 분석

## API 사용 예시

### 회원가입 및 로그인
```bash
# 회원가입
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"홍길동"}'

# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 지출 추가
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"스드메 계약금",
    "amount":500000,
    "date":"2024-01-15",
    "payer":"groom",
    "category_id":1
  }'
```

### 통계 조회
```bash
curl -X GET http://localhost:3000/api/stats/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```
