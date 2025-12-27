# Technical Design Document

## Overview

이 문서는 Needless Wedding 앱의 UI/UX 개선을 위한 기술 설계를 정의합니다. 5개의 주요 요구사항(Dashboard 탭 네비게이션, Budget 리스트 뷰, Checklist 드롭다운 필터, Checklist 원형 진행률, Schedule 주간 뷰)을 구현하기 위한 컴포넌트 구조와 인터페이스를 설계합니다.

## Architecture

### Component Structure

```
pages/
├── Dashboard.tsx          # 탭 네비게이션 추가
├── Budget.tsx             # 리스트 뷰 + 비활성 카테고리 접기
├── Checklist.tsx          # 드롭다운 필터 + 원형 진행률
└── Schedule.tsx           # 주간 뷰 추가

components/
├── dashboard/
│   └── DashboardTabs.tsx  # 탭 네비게이션 컴포넌트
├── budget/
│   ├── BudgetListView.tsx # 리스트 뷰 컴포넌트
│   └── CategoryListItem.tsx # 리스트 아이템 컴포넌트
├── checklist/
│   ├── CategoryDropdown.tsx # 드롭다운 필터 컴포넌트
│   └── CircularProgress.tsx # 원형 진행률 컴포넌트
└── schedule/
    └── WeekView.tsx       # 주간 뷰 컴포넌트
```

## Components

### 1. DashboardTabs Component

**Purpose**: Dashboard 콘텐츠를 탭으로 분리하여 정보 과부하 해결

**Props Interface**:
```typescript
interface DashboardTabsProps {
  activeTab: 'summary' | 'budget' | 'schedule';
  onTabChange: (tab: 'summary' | 'budget' | 'schedule') => void;
}
```

**Implementation Notes**:
- 3개 탭: 요약, 예산, 일정
- 선택된 탭은 흰색 배경 + 그림자로 강조
- 탭 상태는 Dashboard 컴포넌트에서 관리
- sessionStorage로 탭 상태 유지

### 2. BudgetListView Component

**Purpose**: 예산 카테고리를 컴팩트한 리스트 형태로 표시

**Props Interface**:
```typescript
interface BudgetListViewProps {
  categories: BudgetCategory[];
  onCategoryClick: (categoryId: string) => void;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetAmount: number;
  spentAmount: number;
}
```

**Implementation Notes**:
- 지출 있는 카테고리와 없는 카테고리 분리
- 비활성 카테고리는 기본 접힘 상태
- 토글 버튼으로 비활성 카테고리 펼치기/접기
- 각 아이템에 진행률 바 표시

### 3. CategoryListItem Component

**Purpose**: 개별 예산 카테고리 리스트 아이템

**Props Interface**:
```typescript
interface CategoryListItemProps {
  category: BudgetCategory;
  onClick: () => void;
}
```

**Implementation Notes**:
- 아이콘, 이름, 지출액, 예산액, 진행률 바 표시
- 예산 초과 시 빨간색 표시
- 호버 시 그림자 효과

### 4. CategoryDropdown Component

**Purpose**: 체크리스트 카테고리 필터를 드롭다운으로 제공

**Props Interface**:
```typescript
interface CategoryDropdownProps {
  categories: ChecklistCategory[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

interface ChecklistCategory {
  id: string;
  name: string;
  icon: string;
}
```

**Implementation Notes**:
- 클릭 시 드롭다운 메뉴 표시
- "전체" 옵션 포함
- 외부 클릭 시 드롭다운 닫기
- 선택된 카테고리명 버튼에 표시

### 5. CircularProgress Component

**Purpose**: 체크리스트 완료율을 원형으로 시각화

**Props Interface**:
```typescript
interface CircularProgressProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```

**Implementation Notes**:
- SVG 기반 원형 진행률
- rose-400 → rose-500 그라데이션
- 중앙에 퍼센트 텍스트
- CSS transition으로 애니메이션
- 반응형 크기 지원 (sm: 60px, md: 80px, lg: 100px)

### 6. WeekView Component

**Purpose**: 7일 단위 주간 일정 뷰

**Props Interface**:
```typescript
interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  category?: string;
}
```

**Implementation Notes**:
- 현재 주의 7일 표시
- 오늘 날짜 하이라이트
- 이벤트 있는 날짜에 점 표시
- 이전/다음 주 네비게이션
- 날짜 클릭 시 해당 날짜 이벤트 표시

## Data Flow

### Dashboard Tab State Flow
```
User clicks tab → DashboardTabs.onTabChange → Dashboard.setActiveTab → 
sessionStorage.setItem → Re-render with new tab content
```

### Budget List View Flow
```
Budget.tsx loads → Fetch categories → Split active/inactive → 
BudgetListView renders → User toggles inactive → State update → Re-render
```

### Checklist Filter Flow
```
User clicks dropdown → CategoryDropdown opens → User selects category →
onSelect callback → Checklist.setSelectedCategory → Filter items → Re-render
```

### Schedule Week View Flow
```
Schedule.tsx loads → Default to week view → WeekView renders current week →
User clicks date → onDateSelect → Show events for date →
User clicks prev/next → onWeekChange → Update currentDate → Re-render
```

## State Management

### Dashboard State
```typescript
// pages/Dashboard.tsx
const [activeTab, setActiveTab] = useState<'summary' | 'budget' | 'schedule'>(() => {
  return (sessionStorage.getItem('dashboardTab') as any) || 'summary';
});

useEffect(() => {
  sessionStorage.setItem('dashboardTab', activeTab);
}, [activeTab]);
```

### Budget State
```typescript
// pages/Budget.tsx
const [showInactive, setShowInactive] = useState(false);
```

### Checklist State
```typescript
// pages/Checklist.tsx
const [filterOpen, setFilterOpen] = useState(false);
// selectedCategory는 기존 상태 활용
```

### Schedule State
```typescript
// pages/Schedule.tsx
const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
```

## Styling Guidelines

### Tailwind Classes

**탭 버튼 (선택됨)**:
```
bg-white text-stone-800 shadow-sm
```

**탭 버튼 (미선택)**:
```
text-stone-500 hover:text-stone-700
```

**리스트 아이템**:
```
bg-white rounded-xl p-4 border border-stone-100 hover:shadow-sm transition-all
```

**드롭다운 메뉴**:
```
absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-20
```

**원형 진행률 그라데이션**:
```
rose-400 (#fb7185) → rose-500 (#f43f5e)
```

**주간 뷰 날짜 (오늘)**:
```
bg-rose-50 text-rose-500
```

**주간 뷰 날짜 (선택됨)**:
```
bg-rose-500 text-white
```

## Testing Considerations

### Unit Tests
- DashboardTabs: 탭 클릭 시 콜백 호출 확인
- CircularProgress: 퍼센트에 따른 SVG offset 계산 확인
- CategoryDropdown: 외부 클릭 시 닫힘 확인

### Integration Tests
- Dashboard: 탭 전환 시 콘텐츠 변경 확인
- Budget: 비활성 카테고리 토글 동작 확인
- Schedule: 주간/월간 뷰 전환 확인

### E2E Tests
- 전체 사용자 플로우 테스트
- 모바일/데스크톱 반응형 테스트

## Migration Strategy

1. 새 컴포넌트들을 별도 파일로 생성
2. 기존 페이지에 점진적으로 통합
3. 기존 기능 유지하면서 새 UI 추가
4. 테스트 후 기존 코드 제거

## Dependencies

- 기존 의존성 활용 (추가 패키지 불필요)
- date-fns: 날짜 처리 (이미 설치됨)
- Tailwind CSS: 스타일링 (이미 설치됨)
- Framer Motion: 애니메이션 (이미 설치됨, 선택적 사용)
