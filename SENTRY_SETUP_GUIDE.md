# Sentry 에러 모니터링 설정 가이드

## 개요
실시간 에러 추적 및 성능 모니터링을 위한 Sentry 설정이 완료되었습니다.

## 구현된 기능

### 1. 프론트엔드 Sentry 설정

#### 설치된 패키지
```bash
@sentry/react
```

#### 생성된 파일

**src/lib/sentry.ts**
- Sentry 초기화 함수
- 사용자 정보 설정/제거 함수
- 커스텀 컨텍스트 추가 함수
- 수동 에러/메시지 리포팅 함수

**src/components/common/ErrorBoundary/ErrorBoundary.tsx**
- React Error Boundary 컴포넌트
- 에러 발생 시 Sentry에 자동 전송
- 사용자 친화적인 에러 폴백 UI

**src/vite-env.d.ts**
- Vite 환경 변수 타입 정의

#### 수정된 파일

**index.tsx**
- Sentry 초기화 추가 (앱 시작 시 가장 먼저 실행)

**App.tsx**
- ErrorBoundary로 전체 앱 래핑

**src/contexts/AuthContext.tsx**
- 로그인 시 Sentry에 사용자 정보 설정
- 로그아웃 시 사용자 정보 제거

**src/api/client.ts**
- API 에러 발생 시 Sentry에 자동 전송
- 401 에러는 제외 (인증 관련)

### 2. 백엔드 Sentry 설정

#### 설치된 패키지
```bash
@sentry/node
```

#### 생성된 파일

**backend/src/lib/sentry.ts**
- Sentry 초기화 함수
- Express 에러 핸들러
- 수동 에러 캡처 함수

#### 수정된 파일

**backend/src/index.ts**
- Sentry 초기화 추가
- 에러 핸들러에 Sentry 연동

**backend/.env.example**
- SENTRY_DSN 환경 변수 추가
- APP_VERSION 환경 변수 추가

### 3. 환경 변수 설정

#### 프론트엔드 (.env.production)
```env
VITE_API_URL=https://your-api-url.com/api
VITE_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
VITE_APP_VERSION=1.0.0
```

#### 백엔드 (backend/.env.production)
```env
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
APP_VERSION=1.0.0
NODE_ENV=production
```

## Sentry 계정 설정

### 1. Sentry 계정 생성
1. https://sentry.io 접속
2. 무료 계정 생성 (월 5,000 이벤트 무료)

### 2. 프로젝트 생성

#### 프론트엔드 프로젝트
1. "Create Project" 클릭
2. Platform: **React** 선택
3. Alert frequency: 기본값 유지
4. Project name: `wedding-budget-frontend`
5. DSN 복사 → `.env.production`의 `VITE_SENTRY_DSN`에 붙여넣기

#### 백엔드 프로젝트
1. "Create Project" 클릭
2. Platform: **Node.js** 선택
3. Alert frequency: 기본값 유지
4. Project name: `wedding-budget-backend`
5. DSN 복사 → `backend/.env.production`의 `SENTRY_DSN`에 붙여넣기

## 배포 환경 설정

### Vercel (프론트엔드)

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수 추가:
   - `VITE_SENTRY_DSN`: 프론트엔드 DSN
   - `VITE_APP_VERSION`: `1.0.0`

### Render (백엔드)

1. Render 대시보드 → 서비스 선택
2. Environment → Environment Variables
3. 다음 변수 추가:
   - `SENTRY_DSN`: 백엔드 DSN
   - `APP_VERSION`: `1.0.0`
   - `NODE_ENV`: `production`

## 주요 기능

### 1. 자동 에러 캡처

#### 프론트엔드
- React 컴포넌트 에러 (ErrorBoundary)
- API 요청 에러 (axios interceptor)
- 네트워크 에러
- JavaScript 런타임 에러

#### 백엔드
- Express 라우트 에러
- 데이터베이스 에러
- 비동기 에러
- 미들웨어 에러

### 2. 사용자 정보 추적

로그인 시 자동으로 사용자 정보가 Sentry에 전송됩니다:
```typescript
{
  id: "123",
  email: "user@example.com",
  username: "홍길동"
}
```

에러 발생 시 어떤 사용자에게 문제가 생겼는지 즉시 확인 가능합니다.

### 3. 민감 정보 필터링

비밀번호 등 민감한 정보는 자동으로 `[FILTERED]`로 대체됩니다:
- 요청 데이터의 `password` 필드
- 요청 데이터의 `newPassword` 필드

### 4. 무시되는 에러

다음 에러들은 Sentry에 전송되지 않습니다:
- 네트워크 일시 오류 (`Network Error`, `Failed to fetch`)
- 브라우저 확장 프로그램 에러
- 취소된 요청 (`AbortError`, `canceled`)

### 5. 성능 모니터링

- 트랜잭션 추적: 10% 샘플링
- 세션 리플레이: 10% 샘플링
- 에러 발생 시 리플레이: 100% 캡처

## 사용 예시

### 수동 에러 리포팅

```typescript
import { captureError, captureMessage, setSentryContext } from '@/lib/sentry';

// 에러 캡처
try {
  // 위험한 작업
} catch (error) {
  captureError(error as Error, {
    action: 'payment_processing',
    amount: 100000,
  });
}

// 경고 메시지
if (totalExpense > totalBudget) {
  captureMessage('예산 초과 발생', 'warning');
  setSentryContext('budget', {
    totalBudget,
    totalExpense,
    overflow: totalExpense - totalBudget,
  });
}
```

### 커스텀 컨텍스트 추가

```typescript
import { setSentryContext } from '@/lib/sentry';

// 중요한 비즈니스 로직 전에 컨텍스트 설정
setSentryContext('wedding', {
  weddingDate: '2024-12-25',
  venue: '그랜드 웨딩홀',
  guestCount: 200,
});
```

## 에러 폴백 UI

에러 발생 시 사용자에게 표시되는 화면:

```
┌─────────────────────────────────┐
│                                 │
│         [경고 아이콘]            │
│                                 │
│    앗, 문제가 발생했어요         │
│                                 │
│  불편을 드려 죄송합니다.         │
│  잠시 후 다시 시도해주세요.      │
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │ 새로고침   │  │ 홈으로    │  │
│  └───────────┘  └───────────┘  │
│                                 │
│  이 오류는 자동으로 보고되었습니다 │
│                                 │
└─────────────────────────────────┘
```

## Sentry 대시보드 활용

### 1. Issues (이슈)
- 발생한 에러 목록
- 에러 빈도 및 영향받은 사용자 수
- 스택 트레이스 및 컨텍스트 정보

### 2. Performance (성능)
- 트랜잭션 추적
- 느린 API 호출 식별
- 프론트엔드 렌더링 성능

### 3. Releases (릴리즈)
- 버전별 에러 추적
- 새 배포 후 에러 증가 감지
- 롤백 필요 여부 판단

### 4. Alerts (알림)
- 에러 발생 시 이메일/Slack 알림
- 임계값 설정 (예: 1시간에 10개 이상 에러)

## 테스트 방법

### 프론트엔드 에러 테스트

```typescript
// 브라우저 콘솔에서 실행
throw new Error('Sentry 테스트 에러');
```

또는 컴포넌트에 임시 에러 추가:
```typescript
const TestComponent = () => {
  throw new Error('의도적인 테스트 에러');
  return <div>Test</div>;
};
```

### 백엔드 에러 테스트

```typescript
// 테스트 라우트 추가
app.get('/api/test-error', (req, res) => {
  throw new Error('Sentry 백엔드 테스트 에러');
});
```

## 모범 사례

### 1. 에러 컨텍스트 추가
```typescript
captureError(error, {
  userId: user.id,
  action: 'create_expense',
  expenseAmount: 100000,
  category: 'venue',
});
```

### 2. 의미 있는 에러 메시지
```typescript
// ❌ 나쁜 예
throw new Error('Error');

// ✅ 좋은 예
throw new Error('예산 카테고리 생성 실패: 중복된 이름');
```

### 3. 에러 레벨 구분
```typescript
// 정보성 메시지
captureMessage('사용자가 예산 초과 경고를 확인함', 'info');

// 경고
captureMessage('예산 80% 사용', 'warning');

// 에러
captureError(new Error('결제 처리 실패'), { ... });
```

### 4. 프로덕션에서만 활성화
```typescript
// 개발 환경에서는 Sentry 비활성화
if (import.meta.env.PROD) {
  Sentry.init({ ... });
}
```

## 성능 최적화

### 샘플링 비율 조정

트래픽이 많아지면 샘플링 비율을 낮춰서 비용 절감:

```typescript
// src/lib/sentry.ts
tracesSampleRate: 0.05, // 5%로 감소
replaysSessionSampleRate: 0.05, // 5%로 감소
```

### 무시할 에러 추가

불필요한 에러는 무시 목록에 추가:

```typescript
ignoreErrors: [
  'ResizeObserver loop limit exceeded',
  'Non-Error promise rejection captured',
  // 추가...
],
```

## 문제 해결

### DSN이 설정되지 않음
- `.env.production` 파일 확인
- Vercel/Render 환경 변수 확인
- 변수명 오타 확인 (`VITE_SENTRY_DSN`)

### 에러가 Sentry에 표시되지 않음
- 프로덕션 빌드인지 확인 (`npm run build`)
- 브라우저 콘솔에서 Sentry 초기화 확인
- DSN이 올바른지 확인

### 너무 많은 이벤트 발생
- 샘플링 비율 낮추기
- 무시할 에러 목록 확대
- 중복 에러 그룹화 확인

## 비용 관리

### 무료 플랜 (Developer)
- 월 5,000 이벤트
- 1명의 팀원
- 30일 데이터 보관

### 유료 플랜 (Team)
- 월 $26부터
- 50,000 이벤트
- 무제한 팀원
- 90일 데이터 보관

### 비용 절감 팁
1. 샘플링 비율 조정
2. 무시할 에러 필터링
3. 중복 에러 그룹화
4. 개발 환경에서 비활성화

## 관련 문서
- [Sentry 공식 문서](https://docs.sentry.io/)
- [React 통합 가이드](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Node.js 통합 가이드](https://docs.sentry.io/platforms/node/)

## 다음 단계

1. ✅ Sentry 계정 생성
2. ✅ 프론트엔드/백엔드 프로젝트 생성
3. ✅ DSN 복사 및 환경 변수 설정
4. ✅ 배포 환경에 환경 변수 추가
5. ⏭️ 테스트 에러 발생시켜서 확인
6. ⏭️ 알림 설정 (이메일/Slack)
7. ⏭️ 정기적으로 대시보드 모니터링

---

**구현 완료일**: 2024년 12월 3일
**버전**: 1.0.0
**상태**: ✅ 프로덕션 준비 완료
