# 프론트엔드 API 연동 가이드

## 완료된 작업

### 1. API 클라이언트 및 함수 생성 ✅
- `src/api/client.ts` - Axios 기반 API 클라이언트 (JWT 자동 첨부, 토큰 갱신)
- `src/api/auth.ts` - 인증 API
- `src/api/couple.ts` - 커플 프로필 API
- `src/api/venues.ts` - 식장 API
- `src/api/budget.ts` - 예산 API
- `src/api/expenses.ts` - 지출 API
- `src/api/stats.ts` - 통계 API

### 2. 커스텀 훅 생성 ✅
- `src/hooks/useVenues.ts` - 식장 관리
- `src/hooks/useExpenses.ts` - 지출 관리
- `src/hooks/useBudget.ts` - 예산 관리
- `src/hooks/useCoupleProfile.ts` - 커플 프로필 관리
- `src/hooks/useStats.ts` - 통계 조회

### 3. 인증 시스템 ✅
- `src/contexts/AuthContext.tsx` - 인증 컨텍스트
- `src/components/ProtectedRoute.tsx` - 라우트 보호
- `src/pages/Login.tsx` - 로그인 페이지
- `src/pages/Register.tsx` - 회원가입 페이지
- `App.tsx` - 라우팅 업데이트

### 4. 환경 설정 ✅
- `.env.local` - API URL 설정
- `.env.example` - 환경 변수 예제
- `package.json` - axios 의존성 추가

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일이 생성되어 있습니다:
```
VITE_API_URL=http://localhost:3000/api
```

### 3. 백엔드 서버 실행
```bash
cd backend
npm install
npm run migrate
npm run dev
```

### 4. 프론트엔드 실행
```bash
npm run dev
```

## 기존 컴포넌트 수정 가이드

### localStorage → API 호출 변경

#### Before (localStorage 사용)
```typescript
// pages/Venues.tsx
const [venues, setVenues] = useState<Venue[]>([]);

useEffect(() => {
  const saved = localStorage.getItem('venues');
  if (saved) {
    setVenues(JSON.parse(saved));
  }
}, []);

const handleAddVenue = (venue: Venue) => {
  const updated = [...venues, venue];
  setVenues(updated);
  localStorage.setItem('venues', JSON.stringify(updated));
};
```

#### After (API 사용)
```typescript
// pages/Venues.tsx
import { useVenues } from '../hooks/useVenues';

export function Venues() {
  const { venues, loading, error, addVenue, updateVenue, deleteVenue } = useVenues();

  const handleAddVenue = async (venueData: VenueCreateInput) => {
    try {
      await addVenue(venueData);
      // 성공 메시지 표시
    } catch (error) {
      // 에러 처리
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;

  return (
    <div>
      {/* 식장 목록 렌더링 */}
    </div>
  );
}
```

### 수정이 필요한 컴포넌트 목록

1. **pages/Venues.tsx**
   - `useVenues()` 훅 사용
   - localStorage 제거
   - 로딩/에러 상태 처리

2. **pages/Expenses.tsx**
   - `useExpenses()` 훅 사용
   - localStorage 제거
   - 영수증 업로드 기능 추가

3. **pages/Budget.tsx**
   - `useBudget()` 훅 사용
   - localStorage 제거
   - 카테고리 관리 API 연동

4. **pages/Dashboard.tsx**
   - `useStats()` 훅 사용
   - 통계 API 연동

5. **pages/Settings.tsx**
   - `useCoupleProfile()` 훅 사용
   - 프로필 수정 API 연동
   - 이미지 업로드 기능 추가

6. **components/Layout.tsx**
   - `useAuth()` 훅 사용
   - 로그아웃 버튼 추가
   - 사용자 정보 표시

## API 사용 예제

### 1. 식장 추가
```typescript
const { addVenue } = useVenues();

const handleSubmit = async (data: VenueCreateInput) => {
  try {
    const newVenue = await addVenue(data);
    console.log('추가된 식장:', newVenue);
  } catch (error) {
    console.error('식장 추가 실패:', error);
  }
};
```

### 2. 지출 추가
```typescript
const { addExpense } = useExpenses();

const handleAddExpense = async () => {
  try {
    await addExpense({
      title: '스튜디오 계약금',
      amount: 500000,
      date: '2024-01-15',
      payer: 'groom',
      category_id: 1,
    });
  } catch (error) {
    console.error('지출 추가 실패:', error);
  }
};
```

### 3. 영수증 업로드
```typescript
const { uploadReceipt } = useExpenses();

const handleFileUpload = async (expenseId: string, file: File) => {
  try {
    await uploadReceipt(expenseId, file);
  } catch (error) {
    console.error('영수증 업로드 실패:', error);
  }
};
```

### 4. 통계 조회
```typescript
const { summary, fetchSummary } = useStats();

useEffect(() => {
  fetchSummary();
}, []);

// summary 데이터 사용
console.log('총 예산:', summary?.totalBudget);
console.log('총 지출:', summary?.totalSpent);
```

## 에러 처리

모든 훅은 `error` 상태를 제공합니다:

```typescript
const { venues, loading, error } = useVenues();

if (error) {
  return (
    <div className="text-red-500 text-center py-4">
      {error}
      <button onClick={fetchVenues} className="ml-2 underline">
        다시 시도
      </button>
    </div>
  );
}
```

## 로딩 상태

```typescript
const { loading } = useVenues();

if (loading) {
  return (
    <div className="flex justify-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
    </div>
  );
}
```

## 오프라인 지원

모든 데이터 훅은 자동으로 localStorage에 캐시를 저장합니다. API 호출 실패 시 캐시된 데이터를 표시합니다.

## 다음 단계

1. 각 페이지 컴포넌트에서 localStorage 사용 제거
2. 해당 훅으로 교체
3. 로딩/에러 상태 UI 추가
4. 이미지 업로드 기능 구현
5. 토스트 알림 추가 (선택사항)

## 주의사항

- 백엔드 서버가 실행 중이어야 합니다 (포트 3000)
- 프론트엔드는 포트 5173에서 실행됩니다
- CORS 설정이 백엔드에 이미 적용되어 있습니다
- JWT 토큰은 자동으로 갱신됩니다
