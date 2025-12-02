# 💍 결혼 예산 관리 앱

React + TypeScript 프론트엔드와 Node.js + Express + PostgreSQL 백엔드로 구성된 풀스택 결혼 예산 관리 애플리케이션입니다.

## 주요 기능

### 인증 및 보안
- JWT 기반 인증 (액세스/리프레시 토큰)
- 커플 단위 데이터 격리
- 초대 코드를 통한 파트너 연결

### 예산 관리
- 총 예산 설정 및 신랑/신부 분담 비율
- 카테고리별 예산 설정
- 실시간 예산 사용률 추적

### 지출 관리
- 지출 내역 기록 및 관리
- 카테고리별 분류
- 영수증 이미지 업로드
- 필터링 및 정렬 기능

### 식장 관리
- 웨딩홀 정보 저장
- 방문 일정 및 평가
- 장단점 메모
- 이미지 갤러리

### 통계 및 분석
- 전체 예산 요약
- 카테고리별 지출 통계
- 월별 지출 추이
- 신랑/신부별 분담 현황

### 커플 프로필
- 신랑/신부 정보 관리
- 결혼식 날짜 및 D-Day 표시
- 프로필 사진 업로드

## 기술 스택

### 프론트엔드
- React 19
- TypeScript
- React Router
- Axios
- Framer Motion
- Recharts
- Lucide Icons
- Vite

### 백엔드
- Node.js
- Express
- PostgreSQL
- TypeScript
- JWT (jsonwebtoken)
- Multer (파일 업로드)
- Sharp (이미지 최적화)
- bcryptjs (비밀번호 해싱)

## 빠른 시작

### 사전 요구사항
- Node.js 18+
- PostgreSQL 14+
- npm 또는 yarn

### 설치 및 실행

자세한 설치 가이드는 [INSTALLATION.md](INSTALLATION.md)를 참고하세요.

#### 1. 백엔드 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb wedding_budget

# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 데이터베이스 정보 수정

# 데이터베이스 마이그레이션
npm run migrate

# 개발 서버 실행
npm run dev
```

백엔드 서버: http://localhost:3000

#### 2. 프론트엔드 설정

```bash
# 프로젝트 루트로 이동
cd ..

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:5173

## API 문서

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 현재 사용자 정보

### 커플
- `POST /api/couple/invite` - 초대 코드 생성
- `POST /api/couple/join` - 초대 코드로 연결
- `GET /api/couple` - 커플 정보 조회
- `GET /api/couple/profile` - 프로필 조회
- `PUT /api/couple/profile` - 프로필 수정

### 식장
- `GET /api/venues` - 목록 조회
- `POST /api/venues` - 추가
- `GET /api/venues/:id` - 상세 조회
- `PUT /api/venues/:id` - 수정
- `DELETE /api/venues/:id` - 삭제

### 예산
- `GET /api/budget` - 예산 설정 조회
- `PUT /api/budget` - 예산 설정 수정
- `GET /api/budget/categories` - 카테고리 목록
- `POST /api/budget/categories` - 카테고리 추가
- `PUT /api/budget/categories/:id` - 카테고리 수정

### 지출
- `GET /api/expenses` - 목록 조회
- `POST /api/expenses` - 추가
- `GET /api/expenses/:id` - 상세 조회
- `PUT /api/expenses/:id` - 수정
- `DELETE /api/expenses/:id` - 삭제
- `POST /api/expenses/:id/receipt` - 영수증 업로드

### 통계
- `GET /api/stats/summary` - 전체 요약
- `GET /api/stats/by-category` - 카테고리별 통계
- `GET /api/stats/by-month` - 월별 통계
- `GET /api/stats/by-payer` - 분담자별 통계

API 테스트 예제는 `backend/api-examples.http`를 참고하세요.

## 프로젝트 구조

```
wedding-budget-app/
├── backend/                    # 백엔드 API
│   ├── src/
│   │   ├── config/            # 데이터베이스 설정
│   │   ├── controllers/       # 컨트롤러
│   │   ├── middleware/        # 미들웨어
│   │   ├── routes/            # API 라우트
│   │   ├── types/             # TypeScript 타입
│   │   ├── utils/             # 유틸리티
│   │   └── index.ts           # 진입점
│   ├── uploads/               # 업로드 파일
│   └── package.json
│
├── src/                       # 프론트엔드
│   ├── api/                   # API 클라이언트
│   ├── components/            # React 컴포넌트
│   ├── contexts/              # React 컨텍스트
│   ├── hooks/                 # 커스텀 훅
│   ├── pages/                 # 페이지 컴포넌트
│   ├── services/              # 서비스
│   └── types.ts               # TypeScript 타입
│
├── INSTALLATION.md            # 설치 가이드
├── FRONTEND_API_INTEGRATION.md # API 연동 가이드
└── README.md
```

## 개발 가이드

### 프론트엔드 API 연동

자세한 내용은 [FRONTEND_API_INTEGRATION.md](FRONTEND_API_INTEGRATION.md)를 참고하세요.

### 커스텀 훅 사용 예제

```typescript
import { useExpenses } from '../hooks/useExpenses';

function ExpensesPage() {
  const { expenses, loading, error, addExpense } = useExpenses();

  const handleAdd = async (data) => {
    try {
      await addExpense(data);
      // 성공 처리
    } catch (error) {
      // 에러 처리
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return <div>{/* 지출 목록 렌더링 */}</div>;
}
```

## 배포

### 백엔드 배포

```bash
cd backend
npm run build
npm start
```

### 프론트엔드 배포

```bash
npm run build
```

`dist/` 폴더를 정적 호스팅 서비스에 배포하세요.

## 라이선스

MIT

## 기여

이슈와 풀 리퀘스트를 환영합니다!
