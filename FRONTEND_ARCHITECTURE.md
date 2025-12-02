# 프론트엔드 아키텍처 상세 문서

## 📋 목차
1. [디렉토리 구조](#디렉토리-구조)
2. [라우팅 구조](#라우팅-구조)
3. [상태 관리](#상태-관리)
4. [API 통신](#api-통신)
5. [컴포넌트 구조](#컴포넌트-구조)

---

## 디렉토리 구조

```
frontend/ (프로젝트 루트)
├── src/                        # 새로운 API 연동 코드
│   ├── api/                   # API 클라이언트 및 함수
│   │   ├── client.ts         # Axios 인스턴스 (인터셉터)
│   │   ├── auth.ts           # 인증 API
│   │   ├── couple.ts         # 커플 API
│   │   ├── budget.ts         # 예산 API
│   │   ├── expenses.ts       # 지출 API
│   │   ├── venues.ts         # 식장 API
│   │   └── stats.ts          # 통계 API
│   │
│   ├── components/           # 공통 컴포넌트
│   │   ├── ProtectedRoute.tsx    # 라우트 보호
│   │   └── ui/
│   │       └── Toast.tsx          # 토스트 알림
│   │
│   ├── contexts/             # React Context
│   │   └── AuthContext.tsx   # 인증 상태 관리
│   │
│   ├── hooks/                # 커스텀 훅
│   │   ├── useAuth.ts       # 인증 훅
│   │   ├── useVenues.ts     # 식장 관리
│   │   ├── useExpenses.ts   # 지출 관리
│   │   ├── useBudget.ts     # 예산 관리
│   │   ├── useCoupleProfile.ts  # 커플 프로필
│   │   └── useStats.ts      # 통계
│   │
│   └── pages/                # 인증 페이지
│       ├── Login.tsx        # 로그인
│       └── Register.tsx     # 회원가입
│
├── components/               # 기존 UI 컴포넌트
│   ├── Layout.tsx           # 레이아웃 (네비게이션)
│   ├── budget/              # 예산 관련 컴포넌트
│   │   ├── BudgetSettingModal.tsx
│   │   └── CategoryModal.tsx
│   ├── expense/             # 지출 관련 컴포넌트
│   │   └── ExpenseForm.tsx
│   ├── venue/               # 식장 관련 컴포넌트
│   │   ├── VenueCardDeck.tsx
│   │   ├── VenueCompare.tsx
│   │   └── VenueForm.tsx
│   └── ui/                  # UI 컴포넌트
│       ├── BottomSheet.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── DatePicker.tsx
│       ├── GalleryViewer.tsx
│       ├── Skeleton.tsx
│       └── SwipeableRow.tsx
│
├── pages/                    # 페이지 컴포넌트
│   ├── Dashboard.tsx        # 대시보드
│   ├── Budget.tsx           # 예산 관리
│   ├── Expenses.tsx         # 지출 관리
│   ├── Venues.tsx           # 식장 관리
│   ├── Checklist.tsx        # 체크리스트
│   ├── Schedule.tsx         # 일정
│   └── Settings.tsx         # 설정
│
├── services/
│   └── storage.ts           # localStorage 서비스 (레거시)
│
├── App.tsx                  # 메인 앱 (라우팅, AuthProvider)
├── index.tsx                # 진입점
├── types.ts                 # TypeScript 타입 정의
├── vite.config.ts           # Vite 설정
└── package.json
```

---

## 라우팅 구조

### App.tsx (메인 라우터)
```typescript
<AuthProvider>
  <Router>
    <Routes>
      {/* 공개 라우트 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 보호된 라우트 */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/budget" element={
        <ProtectedRoute>
          <Layout><Budget /></Layout>
        </ProtectedRoute>
      } />
      
      {/* ... 기타 라우트 */}
    </Routes>
  </Router>
</AuthProvider>
```

### 라우트 목록
```
/login          # 로그인 (공개)
/register       # 회원가입 (공개)
/               # 대시보드 (보호)
/budget         # 예산 관리 (보호)
/expenses       # 지출 관리 (보호)
/venues         # 식장 관리 (보호)
/checklist      # 체크리스트 (보호)
/schedule       # 일정 (보호)
/settings       # 설정 (보호)
```

---

## 상태 관리

### 1. AuthContext (인증 상태)
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

// 사용법
const { user, isAuthenticated, login, logout } = useAuth();
```

### 2. 커스텀 훅 (데이터 관리)

#### useVenues
```typescript
const {
  venues,           // 식장 목록
  loading,          // 로딩 상태
  error,            // 에러 메시지
  pagination,       // 페이지네이션 정보
  fetchVenues,      // 목록 새로고침
  addVenue,         // 추가
  updateVenue,      // 수정
  deleteVenue,      // 삭제
} = useVenues();
```

#### useExpenses
```typescript
const {
  expenses,         // 지출 목록
  loading,
  error,
  pagination,
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,    // 영수증 업로드
} = useExpenses();
```

#### useBudget
```typescript
const {
  settings,         // 예산 설정
  categories,       // 카테고리 목록
  loading,
  error,
  fetchSettings,
  updateSettings,
  fetchCategories,
  addCategory,
  updateCategory,
} = useBudget();
```

#### useCoupleProfile
```typescript
const {
  profile,          // 커플 프로필
  couple,           // 커플 정보
  loading,
  error,
  updateProfile,
  uploadGroomImage,
  uploadBrideImage,
  uploadCoupleImage,
  createInvite,     // 초대 코드 생성
  joinCouple,       // 커플 연결
} = useCoupleProfile();
```

#### useStats
```typescript
const {
  summary,          // 전체 요약
  byCategory,       // 카테고리별 통계
  byMonth,          // 월별 통계
  byPayer,          // 분담자별 통계
  loading,
  error,
  fetchSummary,
  fetchByCategory,
  fetchByMonth,
  fetchByPayer,
} = useStats();
```

---

## API 통신

### API 클라이언트 (src/api/client.ts)
```typescript
// Axios 인스턴스
const apiClient = axios.create({
  baseURL: 'https://wedding-budget-app.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

// 요청 인터셉터: JWT 토큰 자동 첨부
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 토큰 갱신 및 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 토큰 갱신 시도
      // 실패 시 로그인 페이지로 리다이렉트
    }
    return Promise.reject(error);
  }
);
```

### API 함수 예시
```typescript
// src/api/expenses.ts
export const expenseAPI = {
  getList: (params) => apiClient.get('/expenses', { params }),
  getById: (id) => apiClient.get(`/expenses/${id}`),
  create: (data) => apiClient.post('/expenses', data),
  update: (id, data) => apiClient.put(`/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
  uploadReceipt: (id, formData) => 
    apiClient.post(`/expenses/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};
```

---

## 컴포넌트 구조

### 레이아웃 (components/Layout.tsx)
- 네비게이션 (데스크톱 사이드바, 모바일 하단 바)
- 사용자 메뉴 (로그아웃)
- FAB (Floating Action Button) - 빠른 추가
- D-Day 표시

### 페이지 컴포넌트
- **Dashboard**: 전체 요약, 최근 지출, 예산 현황
- **Budget**: 예산 설정, 카테고리 관리
- **Expenses**: 지출 목록, 필터링, 추가/수정/삭제
- **Venues**: 식장 목록, 비교, 평가
- **Settings**: 커플 프로필, 사진 업로드

### UI 컴포넌트
- **BottomSheet**: 모달 시트
- **Button**: 버튼 컴포넌트
- **Card**: 카드 레이아웃
- **DatePicker**: 날짜 선택
- **GalleryViewer**: 이미지 갤러리
- **Skeleton**: 로딩 스켈레톤
- **SwipeableRow**: 스와이프 가능한 행

---

**다음 문서**: [데이터 플로우](DATA_FLOW.md)
