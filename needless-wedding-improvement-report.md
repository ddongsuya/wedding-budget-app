# Needless Wedding UI/UX 개선 리포트

## 📋 현황 분석

### 앱 개요
- **프레임워크**: React + TypeScript
- **스타일링**: Tailwind CSS
- **차트**: Recharts
- **애니메이션**: Framer Motion
- **라우팅**: React Router

### 현재 문제점 요약

| 문제 | 심각도 | 영향 |
|------|--------|------|
| 홈 화면 정보 과부하 | 🔴 높음 | 사용자 혼란, 스크롤 피로 |
| 모바일 컨텍스트 유실 | 🔴 높음 | "위에서 뭘 봤지?" 증후군 |
| 시각적 계층 부재 | 🟡 중간 | 중요도 구분 어려움 |
| 차트가 너무 큼 | 🟡 중간 | 공간 비효율 |
| 일관성 없는 카드 크기 | 🟢 낮음 | 산만한 느낌 |

---

## 🎯 핵심 개선 전략

### 1. "Sticky Summary" 패턴 도입
> 스크롤해도 핵심 정보가 항상 보이도록

### 2. 정보 계층화
> 중요한 것은 크게, 덜 중요한 것은 작게/숨기기

### 3. Progressive Disclosure
> 처음엔 요약만, 탭/클릭하면 상세 정보

---

## 📱 화면별 개선안

### 1. Dashboard.tsx (홈 화면) - 가장 시급

#### 현재 구조
```
[커플 헤더 - 큼]
[4개 요약 카드]
[막대 차트 - 매우 큼]
[파이 차트]
[분담 차트]
[최근 지출 리스트]
```

#### 개선된 구조
```
[Sticky 요약 바] ← 스크롤해도 고정
  ├─ D-281
  ├─ 예산 진행률 (미니 바)
  └─ 체크리스트 진행률

[커플 카드 - 컴팩트]

[탭 네비게이션]
  [요약] [예산] [일정]

[선택된 탭 콘텐츠만 표시]
```

#### 코드 개선안

```tsx
// Dashboard.tsx 개선안

// 1. Sticky Summary Bar 컴포넌트 추가
const StickySummary: React.FC<{dDay: number, budgetProgress: number, checklistProgress: number}> = 
  ({ dDay, budgetProgress, checklistProgress }) => (
  <div className="sticky top-[60px] md:top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3">
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      {/* D-day */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-rose-500">D-{dDay}</span>
      </div>
      
      {/* 미니 진행 바들 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">예산</span>
          <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 transition-all" 
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-stone-700">{budgetProgress.toFixed(0)}%</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">체크</span>
          <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all" 
              style={{ width: `${checklistProgress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-stone-700">{checklistProgress}%</span>
        </div>
      </div>
    </div>
  </div>
);

// 2. 컴팩트 커플 카드
const CompactCoupleCard: React.FC<{profile: any, dDay: number, dPlusDay: number}> = 
  ({ profile, dDay, dPlusDay }) => (
  <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* 작은 커플 사진 */}
        <div className="flex -space-x-2">
          <div className="w-10 h-10 rounded-full border-2 border-white bg-stone-100 overflow-hidden">
            {profile.groom.avatarUrl ? 
              <img src={profile.groom.avatarUrl} className="w-full h-full object-cover"/> : 
              <User className="w-full h-full p-2 text-stone-400"/>
            }
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-white bg-stone-100 overflow-hidden">
            {profile.bride.avatarUrl ? 
              <img src={profile.bride.avatarUrl} className="w-full h-full object-cover"/> : 
              <User className="w-full h-full p-2 text-stone-400"/>
            }
          </div>
        </div>
        <div>
          <h2 className="font-bold text-stone-800">{profile.nickname || '우리의 결혼'}</h2>
          <p className="text-xs text-stone-500">{profile.groom.name} & {profile.bride.name}</p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="text-2xl font-bold text-rose-500">D-{dDay}</div>
        <div className="text-xs text-stone-400">만난 지 D+{dPlusDay}</div>
      </div>
    </div>
  </div>
);

// 3. 탭 기반 콘텐츠
const [activeTab, setActiveTab] = useState<'summary' | 'budget' | 'schedule'>('summary');

// 탭 UI
<div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-4">
  {[
    { id: 'summary', label: '요약' },
    { id: 'budget', label: '예산' },
    { id: 'schedule', label: '일정' },
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id as any)}
      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
        activeTab === tab.id 
          ? 'bg-white text-stone-800 shadow-sm' 
          : 'text-stone-500 hover:text-stone-700'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>

// 4. 차트 크기 축소 (h-[220px] → h-[160px])
// 5. 파이 차트는 탭하면 확대되는 방식으로
```

---

### 2. Budget.tsx (예산 관리)

#### 현재 문제
- 13개 카테고리가 2x2 그리드로 나열
- 모든 카테고리가 동일한 중요도
- 스크롤이 길어짐

#### 개선안

```tsx
// 리스트 뷰로 변경 (그리드 → 컴팩트 리스트)

const BudgetCategoryList: React.FC<{categories: BudgetCategory[]}> = ({ categories }) => {
  // 지출 있는 항목과 없는 항목 분리
  const activeCategories = categories.filter(c => c.spentAmount > 0);
  const inactiveCategories = categories.filter(c => c.spentAmount === 0);
  const [showInactive, setShowInactive] = useState(false);

  return (
    <div className="space-y-2">
      {/* 활성 카테고리 (지출 있음) */}
      {activeCategories.map(category => (
        <CategoryListItem key={category.id} category={category} />
      ))}
      
      {/* 비활성 카테고리 토글 */}
      {inactiveCategories.length > 0 && (
        <>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="w-full py-3 text-sm text-stone-500 hover:text-stone-700 flex items-center justify-center gap-2"
          >
            {showInactive ? '접기' : `미사용 항목 ${inactiveCategories.length}개 보기`}
            <ChevronDown className={`transition-transform ${showInactive ? 'rotate-180' : ''}`} size={16} />
          </button>
          
          {showInactive && (
            <div className="space-y-2 opacity-60">
              {inactiveCategories.map(category => (
                <CategoryListItem key={category.id} category={category} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// 컴팩트 리스트 아이템
const CategoryListItem: React.FC<{category: BudgetCategory}> = ({ category }) => {
  const progress = category.budgetAmount > 0 
    ? Math.min((category.spentAmount / category.budgetAmount) * 100, 100) 
    : 0;
  const isOverBudget = category.spentAmount > category.budgetAmount && category.budgetAmount > 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-100 flex items-center gap-4 hover:shadow-sm transition-all cursor-pointer">
      {/* 아이콘 */}
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: category.color }}
      >
        {getIcon(category.icon)}
      </div>
      
      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-stone-800 truncate">{category.name}</span>
          <span className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : 'text-stone-700'}`}>
            {formatMoney(category.spentAmount)}
          </span>
        </div>
        
        {/* 진행 바 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                backgroundColor: isOverBudget ? '#ef4444' : category.color
              }}
            />
          </div>
          <span className="text-xs text-stone-500 w-12 text-right">
            {formatMoney(category.budgetAmount)}
          </span>
        </div>
      </div>
      
      {/* 화살표 */}
      <ChevronRight size={16} className="text-stone-300 flex-shrink-0" />
    </div>
  );
};
```

---

### 3. Checklist.tsx (체크리스트)

#### 현재 장점 ✅
- D-day 기반 그룹핑 좋음
- 진행률 표시 좋음

#### 개선점

```tsx
// 1. 카테고리 필터를 드롭다운으로 변경
const [filterOpen, setFilterOpen] = useState(false);

<div className="relative">
  <button 
    onClick={() => setFilterOpen(!filterOpen)}
    className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl"
  >
    <Filter size={16} />
    <span>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : '전체'}</span>
    <ChevronDown size={16} />
  </button>
  
  {filterOpen && (
    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-20">
      <button 
        onClick={() => { setSelectedCategory(null); setFilterOpen(false); }}
        className="w-full px-4 py-2 text-left hover:bg-stone-50"
      >
        전체
      </button>
      {categories.map(cat => (
        <button 
          key={cat.id}
          onClick={() => { setSelectedCategory(cat.id); setFilterOpen(false); }}
          className="w-full px-4 py-2 text-left hover:bg-stone-50 flex items-center gap-2"
        >
          <span>{cat.icon}</span>
          <span>{cat.name}</span>
        </button>
      ))}
    </div>
  )}
</div>

// 2. 원형 진행률로 변경
const CircularProgress: React.FC<{percentage: number}> = ({ percentage }) => {
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative w-20 h-20">
      <svg className="transform -rotate-90 w-20 h-20">
        <circle
          cx="40" cy="40" r="36"
          stroke="#e7e5e4"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="40" cy="40" r="36"
          stroke="url(#gradient)"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-rose-500">{percentage}%</span>
      </div>
    </div>
  );
};
```

---

### 4. Schedule.tsx (일정)

#### 개선안

```tsx
// 주간 뷰를 기본으로 + 축소 가능한 캘린더

const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
const [calendarCollapsed, setCalendarCollapsed] = useState(true);

// 주간 뷰
const WeekView: React.FC = () => {
  const weekDays = getWeekDays(currentDate); // 현재 주의 7일
  
  return (
    <div className="bg-white rounded-2xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-stone-800">이번 주</h3>
        <button 
          onClick={() => setViewMode('month')}
          className="text-sm text-rose-500"
        >
          월간 보기
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => {
          const dayEvents = eventsByDate[format(day, 'yyyy-MM-dd')] || [];
          const hasEvents = dayEvents.length > 0;
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`p-2 rounded-xl text-center transition-all ${
                isSameDay(day, selectedDate) 
                  ? 'bg-rose-500 text-white' 
                  : isToday(day)
                    ? 'bg-rose-50 text-rose-500'
                    : 'hover:bg-stone-50'
              }`}
            >
              <div className="text-xs text-stone-500">{format(day, 'E', { locale: ko })}</div>
              <div className="font-bold">{format(day, 'd')}</div>
              {hasEvents && (
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
```

---

### 5. Layout.tsx (전체 레이아웃)

#### 개선점
- 모바일 헤더에 핵심 정보 추가
- 하단 네비게이션 아이콘 크기 조정

```tsx
// 모바일 헤더 개선
<header className={`md:hidden sticky top-0 z-40 transition-all duration-300 ${
  isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white border-b border-stone-100'
}`}>
  <div className="px-4 py-3 flex items-center justify-between">
    <h1 className="font-bold text-rose-500">Wedding Planner</h1>
    
    {/* D-day 뱃지 추가 */}
    {profile?.weddingDate && (
      <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-sm font-bold">
        D-{dDay}
      </div>
    )}
    
    <div className="flex items-center gap-2">
      {/* ... 기존 아이콘들 ... */}
    </div>
  </div>
</header>
```

---

## 🎨 디자인 시스템 개선

### 색상 체계 강화

```css
/* tailwind.config.js에 추가 */
colors: {
  // 기존 rose 유지
  
  // 상태 색상 추가
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  danger: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
}
```

### 그림자 개선

```css
boxShadow: {
  'card': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  'card-hover': '0 4px 6px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.06)',
  'sticky': '0 4px 12px rgba(0,0,0,0.08)',
}
```

---

## 📊 우선순위 로드맵

### Phase 1 (즉시 적용 가능) - 1~2일
- [ ] Dashboard에 Sticky Summary Bar 추가
- [ ] 커플 헤더 컴팩트화
- [ ] 차트 높이 축소 (h-[220px] → h-[160px])

### Phase 2 (1주일) 
- [ ] Budget 카테고리를 리스트 뷰로 변경
- [ ] 비활성 카테고리 접기 기능
- [ ] Checklist 필터 드롭다운 변경

### Phase 3 (2주일)
- [ ] Schedule 주간 뷰 기본 적용
- [ ] 탭 기반 Dashboard 콘텐츠
- [ ] 모바일 반응형 전면 개선

---

## 💡 추가 제안

### 1. 온보딩 개선
첫 사용자를 위한 간단한 튜토리얼 또는 힌트 추가

### 2. 다크 모드
저녁에 앱을 많이 사용하는 사용자를 위해

### 3. 위젯 기능
홈 화면 위젯으로 D-day 및 체크리스트 진행률 표시

### 4. 공유 기능
커플이 함께 편집할 수 있는 실시간 동기화

---

## 📝 참고 자료

### 경쟁 앱 UI/UX 베스트 프랙티스
- **The Knot**: 상세한 예산 카테고리, 결제 추적
- **Zola**: 직관적 UI, 모던한 디자인
- **WeddingWire**: 예상 vs 실제 비용 비교

### 디자인 원칙
1. **Less is More**: 한 화면에 3개 이하의 핵심 정보
2. **Context Preservation**: 스크롤해도 현재 위치 파악 가능
3. **Progressive Disclosure**: 처음엔 요약, 탭하면 상세
4. **Consistent Hierarchy**: 중요도에 따른 명확한 시각적 차이

---

*작성일: 2025-12-28*
*버전: 1.0*
