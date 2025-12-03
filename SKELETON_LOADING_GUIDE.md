# 스켈레톤 로딩 UI 가이드

## 개요
사용자 경험 향상을 위해 데이터 로딩 중 스켈레톤 UI를 표시하는 시스템을 구현했습니다.

## 구현된 컴포넌트

### 1. 기본 Skeleton 컴포넌트
**위치**: `src/components/common/Skeleton/Skeleton.tsx`

**기능**:
- 다양한 형태의 스켈레톤 지원 (text, circular, rectangular, rounded)
- 애니메이션 옵션 (pulse, shimmer, none)
- 커스터마이징 가능한 크기와 스타일

**사용 예시**:
```tsx
import { Skeleton } from '../src/components/common/Skeleton/Skeleton';

// 텍스트 스켈레톤
<Skeleton variant="text" width={200} height={20} />

// 원형 스켈레톤 (프로필 이미지 등)
<Skeleton variant="circular" width={80} height={80} />

// 둥근 사각형 (카드, 이미지 등)
<Skeleton variant="rounded" width="100%" height={200} />

// Shimmer 애니메이션
<Skeleton variant="rectangular" animation="shimmer" width={300} height={100} />
```

### 2. 페이지별 스켈레톤 컴포넌트

#### DashboardSkeleton
**위치**: `src/components/skeleton/DashboardSkeleton.tsx`
- 대시보드 페이지의 전체 레이아웃을 모방
- 커플 헤더, 요약 카드, 차트 영역, 최근 지출 목록 스켈레톤 포함

#### ExpensesSkeleton
**위치**: `src/components/skeleton/ExpensesSkeleton.tsx`
- 지출 내역 페이지의 리스트 레이아웃 모방
- 검색바, 필터, 지출 카드 스켈레톤 포함

#### VenuesSkeleton
**위치**: `src/components/skeleton/VenuesSkeleton.tsx`
- 웨딩홀 비교 페이지의 레이아웃 모방
- 모바일 카드뷰와 데스크톱 테이블뷰 모두 지원

#### ListItemSkeleton
**위치**: `src/components/skeleton/ListItemSkeleton.tsx`
- 재사용 가능한 리스트 아이템 스켈레톤
- 이미지 유무, 라인 수, 이미지 형태 커스터마이징 가능

## 적용된 페이지

### 1. Dashboard (pages/Dashboard.tsx)
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  setTimeout(() => {
    // 데이터 로드
    setLoading(false);
  }, 800);
}, []);

if (loading) return <DashboardSkeleton />;
```

### 2. Expenses (pages/Expenses.tsx)
```tsx
const [loading, setLoading] = useState(true);

const loadData = () => {
  setTimeout(() => {
    setExpenses(StorageService.getExpenses());
    setLoading(false);
  }, 500);
};

{loading ? <ExpensesSkeleton /> : /* 실제 컨텐츠 */}
```

### 3. Venues (pages/Venues.tsx)
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  setTimeout(() => {
    setVenues(StorageService.getVenues());
    setLoading(false);
  }, 600);
}, []);

{loading ? (
  <>
    {/* 모바일 스켈레톤 */}
    {/* 데스크톱 스켈레톤 */}
  </>
) : (
  /* 실제 컨텐츠 */
)}
```

### 4. Budget (pages/Budget.tsx)
```tsx
const [loading, setLoading] = useState(true);

useEffect(() => {
  setTimeout(() => {
    setBudget(StorageService.getBudget());
    setLoading(false);
  }, 500);
}, []);

if (loading) {
  return (
    /* 커스텀 스켈레톤 레이아웃 */
  );
}
```

## 애니메이션

### Pulse 애니메이션
- Tailwind의 기본 `animate-pulse` 사용
- 부드러운 페이드 인/아웃 효과

### Shimmer 애니메이션
- `index.html`에 정의된 커스텀 애니메이션
- 좌우로 이동하는 그라데이션 효과
- 더 동적이고 현대적인 느낌

```css
@keyframes shimmer {
  '0%': { backgroundPosition: '200% 0' },
  '100%': { backgroundPosition: '-200% 0' },
}
```

## 사용 가이드

### 새로운 페이지에 스켈레톤 추가하기

1. **로딩 상태 추가**:
```tsx
const [loading, setLoading] = useState(true);
```

2. **데이터 로드 시 로딩 상태 관리**:
```tsx
useEffect(() => {
  const loadData = async () => {
    try {
      // 데이터 로드
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

3. **스켈레톤 표시**:
```tsx
if (loading) {
  return <YourPageSkeleton />;
}
```

### 커스텀 스켈레톤 만들기

```tsx
import { Skeleton } from '../src/components/common/Skeleton/Skeleton';

export const CustomSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <Skeleton variant="text" width={200} height={28} />
      
      {/* 카드 */}
      <div className="bg-white rounded-xl p-4">
        <Skeleton variant="text" width="60%" height={20} className="mb-2" />
        <Skeleton variant="rounded" width="100%" height={200} />
      </div>
      
      {/* 리스트 */}
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-3">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="40%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 모범 사례

1. **실제 레이아웃 모방**: 스켈레톤은 실제 컨텐츠의 레이아웃과 최대한 유사하게 만들기
2. **적절한 로딩 시간**: 너무 짧으면 깜빡임, 너무 길면 답답함 (500-800ms 권장)
3. **반응형 디자인**: 모바일과 데스크톱에서 각각 적절한 스켈레톤 표시
4. **일관성**: 프로젝트 전체에서 일관된 스켈레톤 스타일 유지
5. **접근성**: 스크린 리더를 위한 적절한 aria-label 추가 고려

## 성능 최적화

- 스켈레톤 컴포넌트는 가볍게 유지
- 복잡한 애니메이션보다는 간단한 pulse/shimmer 사용
- 필요한 경우에만 스켈레톤 표시 (매우 빠른 로딩은 스켈레톤 생략 가능)

## 향후 개선 사항

- [ ] 스켈레톤 테마 커스터마이징 (다크모드 지원)
- [ ] 더 많은 variant 추가 (wave, gradient 등)
- [ ] 자동 스켈레톤 생성 유틸리티
- [ ] Storybook을 통한 스켈레톤 컴포넌트 문서화
