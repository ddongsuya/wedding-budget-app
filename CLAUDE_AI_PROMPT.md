# 🤖 Claude AI에게 제공할 프롬프트

## 📋 프로젝트 컨텍스트 제공 방법

Claude AI에게 이 프로젝트에 대해 설명할 때, 다음 프롬프트를 사용하세요:

---

## 🎯 프롬프트 템플릿

```
안녕하세요! 제가 개발한 결혼 예산 관리 웹 애플리케이션에 대해 설명드리겠습니다.
앞으로 이 프로젝트의 코드 수정 및 개선을 도와주셔야 하므로, 프로젝트 구조를 완벽히 이해해주세요.

## 📌 프로젝트 개요

**프로젝트명**: Wedding Budget App (결혼 예산 관리 앱)
**타입**: 풀스택 웹 애플리케이션
**배포 상태**: 프로덕션 운영 중

- **프론트엔드**: https://wedding-budget-app.vercel.app (Vercel)
- **백엔드 API**: https://wedding-budget-app.onrender.com (Render)
- **GitHub**: https://github.com/ddongsuya/wedding-budget-app

## 🏗️ 기술 스택

### 프론트엔드
- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **라우팅**: React Router v6
- **상태 관리**: React Context API + Custom Hooks
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios
- **배포**: Vercel

### 백엔드
- **런타임**: Node.js + TypeScript
- **프레임워크**: Express.js
- **데이터베이스**: PostgreSQL (Neon)
- **ORM**: 없음 (Raw SQL with pg)
- **인증**: JWT (Access Token + Refresh Token)
- **파일 업로드**: Multer + Cloudinary
- **배포**: Render

## 🎯 핵심 기능

1. **사용자 인증**
   - 회원가입/로그인
   - JWT 기반 인증 (액세스 토큰 + 리프레시 토큰)
   - 자동 토큰 갱신

2. **커플 연결**
   - 초대 코드 생성 및 공유
   - 커플 프로필 관리 (결혼 날짜, 예산 등)

3. **예산 관리**
   - 카테고리별 예산 설정
   - 예산 vs 실제 지출 비교

4. **지출 기록**
   - 지출 내역 추가/수정/삭제
   - 영수증 이미지 업로드
   - 카테고리별 분류

5. **식장 관리**
   - 식장 정보 저장
   - 평가 및 메모
   - 이미지 업로드

6. **통계 및 분석**
   - 총 예산 vs 총 지출
   - 카테고리별 지출 분석
   - 차트 시각화

## 🔑 핵심 아키텍처 원칙

### 1. 커플 단위 데이터 격리
- **모든 데이터는 `couple_id`로 격리됩니다**
- 사용자는 자신이 속한 커플의 데이터만 접근 가능
- 백엔드 미들웨어에서 자동으로 `couple_id` 검증

### 2. JWT 인증 플로우
```
1. 로그인 → Access Token (15분) + Refresh Token (7일)
2. API 요청 시 Access Token 사용
3. Access Token 만료 → 자동으로 Refresh Token으로 갱신
4. Refresh Token 만료 → 재로그인 필요
```

### 3. 하이브리드 구조
- **기존 로컬 코드** + **새 백엔드 API 연동 코드** 공존
- 점진적으로 API 연동으로 전환 중

## 📁 주요 파일 구조

### 백엔드 핵심 파일
```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.ts              # JWT 인증 미들웨어
│   │   └── validation.ts        # 요청 검증
│   ├── controllers/
│   │   ├── authController.ts    # 회원가입/로그인
│   │   ├── coupleController.ts  # 커플 연결
│   │   ├── budgetController.ts  # 예산 관리
│   │   ├── expenseController.ts # 지출 관리
│   │   ├── venueController.ts   # 식장 관리
│   │   └── statsController.ts   # 통계
│   ├── config/
│   │   ├── database.ts          # PostgreSQL 연결
│   │   └── migrate.ts           # DB 마이그레이션
│   └── utils/
│       ├── jwt.ts               # JWT 생성/검증
│       └── upload.ts            # Cloudinary 업로드
```

### 프론트엔드 핵심 파일
```
src/
├── contexts/
│   └── AuthContext.tsx          # 인증 상태 관리
├── api/
│   ├── client.ts                # Axios 인스턴스 (토큰 자동 갱신)
│   ├── auth.ts                  # 인증 API
│   ├── couple.ts                # 커플 API
│   ├── budget.ts                # 예산 API
│   └── expenses.ts              # 지출 API
├── hooks/
│   ├── useBudget.ts             # 예산 데이터 관리
│   ├── useExpenses.ts           # 지출 데이터 관리
│   ├── useVenues.ts             # 식장 데이터 관리
│   └── useStats.ts              # 통계 데이터 관리
└── pages/
    ├── Login.tsx                # 로그인 페이지
    ├── Register.tsx             # 회원가입 페이지
    ├── Dashboard.tsx            # 대시보드
    ├── Budget.tsx               # 예산 관리
    ├── Expenses.tsx             # 지출 관리
    └── Venues.tsx               # 식장 관리
```

## 🔐 인증 시스템 상세

### 토큰 저장 위치
- **Access Token**: `localStorage.getItem('accessToken')`
- **Refresh Token**: `localStorage.getItem('refreshToken')`

### 자동 토큰 갱신 로직
`src/api/client.ts`에서 Axios 인터셉터로 구현:
```typescript
// 401 에러 발생 시 자동으로 토큰 갱신 시도
response interceptor → 401 감지 → /auth/refresh 호출 → 새 토큰 저장 → 원래 요청 재시도
```

### 인증이 필요한 모든 API
- Authorization 헤더: `Bearer {accessToken}`
- 백엔드에서 `authenticateToken` 미들웨어로 검증

## 🗄️ 데이터베이스 스키마

### 주요 테이블
1. **users** - 사용자 정보
   - id, email, password_hash, name, couple_id

2. **couples** - 커플 정보
   - id, wedding_date, total_budget, invite_code

3. **budget_categories** - 예산 카테고리
   - id, couple_id, category_name, allocated_amount

4. **expenses** - 지출 내역
   - id, couple_id, category_id, amount, description, receipt_url

5. **venues** - 식장 정보
   - id, couple_id, name, location, rating, notes

## ⚠️ 코드 수정 시 주의사항

### 1. 반드시 지켜야 할 규칙
- **모든 API 엔드포인트는 `couple_id` 검증 필수**
- **JWT 토큰 만료 처리 로직 유지**
- **파일 업로드는 Cloudinary 사용**
- **환경 변수는 `.env` 파일에서 관리**

### 2. 데이터 격리 원칙
```typescript
// ❌ 잘못된 예시 (couple_id 검증 없음)
const expenses = await pool.query('SELECT * FROM expenses');

// ✅ 올바른 예시 (couple_id로 필터링)
const expenses = await pool.query(
  'SELECT * FROM expenses WHERE couple_id = $1',
  [req.user.couple_id]
);
```

### 3. 에러 처리
- 모든 컨트롤러는 try-catch로 에러 처리
- 적절한 HTTP 상태 코드 반환 (400, 401, 404, 500)
- 사용자 친화적인 에러 메시지 제공

### 4. 타입 안정성
- TypeScript 타입 정의 준수
- `backend/src/types/index.ts`에 공통 타입 정의
- `types.ts`에 프론트엔드 타입 정의

## 📖 참고 문서

프로젝트 루트에 다음 문서들이 있습니다:

1. **ARCHITECTURE_OVERVIEW.md** - 전체 아키텍처 개요
2. **BACKEND_ARCHITECTURE.md** - 백엔드 상세 구조
3. **FRONTEND_ARCHITECTURE.md** - 프론트엔드 상세 구조
4. **DATA_FLOW.md** - 데이터 플로우 및 주요 기능
5. **DEPLOYMENT.md** - 배포 환경 및 설정
6. **DATABASE_SETUP.md** - 데이터베이스 설정
7. **INSTALLATION.md** - 로컬 개발 환경 설정

## 🚀 로컬 개발 환경 실행

### 백엔드
```bash
cd backend
npm install
npm run dev  # http://localhost:3001
```

### 프론트엔드
```bash
npm install
npm run dev  # http://localhost:5173
```

## 💡 코드 수정 요청 시 제공할 정보

코드 수정을 요청할 때는 다음 정보를 함께 제공해주세요:

1. **수정하려는 기능**: 예) "지출 삭제 기능 추가"
2. **관련 파일**: 예) "backend/src/controllers/expenseController.ts"
3. **현재 문제점**: 예) "삭제 버튼이 작동하지 않음"
4. **원하는 동작**: 예) "삭제 확인 후 목록에서 제거"

## ✅ 이제 준비 완료!

위 내용을 숙지하셨다면, 이제 이 프로젝트의 코드를 수정하거나 개선할 준비가 되었습니다.
질문이 있거나 특정 부분에 대해 더 자세한 설명이 필요하면 언제든 물어보세요!
```

---

## 🎯 사용 방법

1. 위 프롬프트를 **복사**하여 Claude AI에게 전달
2. 추가로 수정하려는 기능이나 파일을 구체적으로 설명
3. 필요시 관련 코드 파일을 함께 첨부

## 💡 팁

- **구체적인 요청**: "로그인 기능 수정"보다 "로그인 시 이메일 중복 체크 추가"
- **파일 경로 명시**: 어떤 파일을 수정해야 하는지 명확히
- **현재 동작 설명**: 지금 어떻게 작동하는지 설명
- **원하는 결과**: 어떻게 바뀌길 원하는지 명확히

---

이 프롬프트를 사용하면 Claude AI가 프로젝트 구조를 완벽히 이해하고 정확한 코드 수정을 제안할 수 있습니다! 🎉
