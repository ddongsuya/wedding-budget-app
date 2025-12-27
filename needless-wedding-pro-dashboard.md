# Needless Wedding 프로페셔널 대시보드 개선안

## 🎯 "프로페셔널" 디자인의 핵심 요소

| 요소 | 현재 | 프로 레벨 |
|------|------|----------|
| 정보 밀도 | 낮음 (공간 낭비) | 높음 (효율적 배치) |
| 시각적 계층 | 평평함 | 명확한 우선순위 |
| 데이터 시각화 | 기본 차트 | 인사이트 중심 |
| 타이포그래피 | 일관성 부족 | 체계적 스케일 |
| 색상 사용 | 장식적 | 의미 기반 |
| 여백 | 불규칙 | 수학적 리듬 |

---

## 1. 레이아웃 리디자인

### 현재 구조의 문제점
```
[커플 헤더 - 너무 큼]
[4개 카드 - 동일 크기]
[막대 차트 - 거대]
[파이 차트]
[분담 차트]
[최근 지출]
```

### 프로페셔널 구조
```
┌─────────────────────────────────────────────────┐
│  [로고]        D-281        [알림] [설정]       │  ← 컴팩트 헤더
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │                  │  │                      │ │
│  │   핵심 지표 카드   │  │    예산 도넛 차트     │ │
│  │   (D-day, 예산)  │  │    + 범례            │ │
│  │                  │  │                      │ │
│  └──────────────────┘  └──────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │                                          │   │
│  │          카테고리별 예산 바 차트            │   │
│  │          (컴팩트, 수평)                    │   │
│  │                                          │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────┐  ┌─────────────────────┐   │
│  │  최근 지출 (5)   │  │  다가오는 일정 (3)   │   │
│  │  - 항목 1       │  │  - 일정 1           │   │
│  │  - 항목 2       │  │  - 일정 2           │   │
│  └─────────────────┘  └─────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 2. 핵심 지표 카드 (KPI Cards)

### 현재 문제
- 4개 카드가 동일한 비중
- 숫자가 작고 눈에 안 띔
- 트렌드/변화 정보 없음

### 프로 버전

```tsx
// components/dashboard/KPICards.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Calendar, Wallet, CheckSquare, AlertTriangle } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  accentColor: string;
  priority?: 'primary' | 'secondary';
  alert?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  accentColor,
  priority = 'secondary',
  alert = false,
}) => {
  const isPrimary = priority === 'primary';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        ${isPrimary 
          ? `bg-gradient-to-br ${accentColor} text-white shadow-lg` 
          : 'bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow'
        }
      `}
    >
      {/* 배경 패턴 (Primary 카드) */}
      {isPrimary && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </div>
      )}

      {/* 알림 뱃지 */}
      {alert && (
        <div className="absolute top-3 right-3">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}

      <div className="relative z-10">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${isPrimary ? 'text-white/80' : 'text-stone-500'}`}>
            {label}
          </span>
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${isPrimary ? 'bg-white/20' : 'bg-stone-100'}
          `}>
            {icon}
          </div>
        </div>

        {/* 메인 값 */}
        <div className="mb-2">
          <span className={`
            text-3xl font-bold tracking-tight
            ${isPrimary ? 'text-white' : 'text-stone-800'}
          `}>
            {value}
          </span>
          {subValue && (
            <span className={`text-sm ml-2 ${isPrimary ? 'text-white/70' : 'text-stone-400'}`}>
              {subValue}
            </span>
          )}
        </div>

        {/* 트렌드 */}
        {trend && (
          <div className={`
            flex items-center gap-1.5 text-sm
            ${isPrimary ? 'text-white/90' : ''}
          `}>
            {trend.direction === 'up' && (
              <TrendingUp className={`w-4 h-4 ${isPrimary ? '' : 'text-emerald-500'}`} />
            )}
            {trend.direction === 'down' && (
              <TrendingDown className={`w-4 h-4 ${isPrimary ? '' : 'text-red-500'}`} />
            )}
            {trend.direction === 'neutral' && (
              <Minus className={`w-4 h-4 ${isPrimary ? '' : 'text-stone-400'}`} />
            )}
            <span className={`font-medium ${
              !isPrimary && (
                trend.direction === 'up' ? 'text-emerald-600' :
                trend.direction === 'down' ? 'text-red-600' : 'text-stone-500'
              )
            }`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className={isPrimary ? 'text-white/70' : 'text-stone-400'}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// KPI 그리드
export const KPIGrid: React.FC<{
  dDay: number;
  totalBudget: number;
  spent: number;
  checklistProgress: number;
  overBudgetCount: number;
}> = ({ dDay, totalBudget, spent, checklistProgress, overBudgetCount }) => {
  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  
  const budgetProgress = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* D-day - Primary */}
      <KPICard
        label="결혼까지"
        value={`D-${dDay}`}
        subValue={dDay <= 30 ? '곧이에요!' : undefined}
        icon={<Calendar className="w-5 h-5 text-white" />}
        accentColor="from-rose-500 to-pink-600"
        priority="primary"
        alert={dDay <= 7}
      />

      {/* 예산 사용률 */}
      <KPICard
        label="예산 사용"
        value={`${budgetProgress.toFixed(1)}%`}
        subValue={`/ ${formatMoney(totalBudget)}`}
        trend={{
          value: 12,
          label: '이번 달',
          direction: 'up',
        }}
        icon={<Wallet className="w-5 h-5 text-amber-500" />}
        accentColor=""
        alert={budgetProgress > 90}
      />

      {/* 체크리스트 */}
      <KPICard
        label="준비 진행률"
        value={`${checklistProgress}%`}
        subValue="완료"
        trend={{
          value: 5,
          label: '지난주 대비',
          direction: 'up',
        }}
        icon={<CheckSquare className="w-5 h-5 text-emerald-500" />}
        accentColor=""
      />

      {/* 초과 항목 */}
      <KPICard
        label="예산 초과"
        value={overBudgetCount}
        subValue="개 항목"
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        accentColor=""
        alert={overBudgetCount > 0}
      />
    </div>
  );
};
```

---

## 3. 예산 시각화 개선

### 현재 문제
- 막대 차트가 너무 큼
- 인사이트가 없음 (그냥 숫자 나열)

### 프로 버전: 인사이트 중심 차트

```tsx
// components/dashboard/BudgetInsights.tsx

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  color: string;
}

export const BudgetDonutChart: React.FC<{ 
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
}> = ({ categories, totalBudget, totalSpent }) => {
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const chartData = categories
    .filter(c => c.spent > 0)
    .map(c => ({ name: c.name, value: c.spent, color: c.color }));

  // 남은 예산도 표시
  if (remaining > 0) {
    chartData.push({ name: '남은 예산', value: remaining, color: '#e7e5e4' });
  }

  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800">예산 현황</h3>
        <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
          이번 달
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* 도넛 차트 */}
        <div className="relative w-40 h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* 중앙 텍스트 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-stone-800">
              {spentPercentage.toFixed(0)}%
            </span>
            <span className="text-xs text-stone-400">사용</span>
          </div>
        </div>

        {/* 범례 & 인사이트 */}
        <div className="flex-1 space-y-3">
          {/* 주요 지출 TOP 3 */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              TOP 지출
            </span>
            {categories
              .filter(c => c.spent > 0)
              .sort((a, b) => b.spent - a.spent)
              .slice(0, 3)
              .map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-stone-600 flex-1 truncate">{cat.name}</span>
                  <span className="text-sm font-semibold text-stone-800">
                    {formatMoney(cat.spent)}
                  </span>
                </div>
              ))
            }
          </div>

          {/* 남은 예산 */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-500">남은 예산</span>
              <span className="text-lg font-bold text-emerald-600">
                {formatMoney(remaining)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 카테고리별 수평 바 차트 (컴팩트)

```tsx
// components/dashboard/CategoryBars.tsx

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface CategoryBarProps {
  categories: Array<{
    name: string;
    budget: number;
    spent: number;
    color: string;
    icon: string;
  }>;
  onCategoryClick?: (name: string) => void;
}

export const CategoryBars: React.FC<CategoryBarProps> = ({ categories, onCategoryClick }) => {
  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 0 }).format(n);

  // 지출 있는 항목 우선, 예산 대비 사용률 순
  const sortedCategories = [...categories]
    .filter(c => c.budget > 0)
    .sort((a, b) => {
      const aRatio = a.spent / a.budget;
      const bRatio = b.spent / b.budget;
      return bRatio - aRatio;
    })
    .slice(0, 6); // 최대 6개만 표시

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800">카테고리별 예산</h3>
        <button className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1">
          전체 보기 <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {sortedCategories.map((cat, index) => {
          const progress = Math.min((cat.spent / cat.budget) * 100, 100);
          const isOverBudget = cat.spent > cat.budget;

          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onCategoryClick?.(cat.name)}
              className="group cursor-pointer"
            >
              {/* 라벨 행 */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isOverBudget ? 'text-red-500' : 'text-stone-800'}`}>
                    {formatMoney(cat.spent)}
                  </span>
                  <span className="text-xs text-stone-400">
                    / {formatMoney(cat.budget)}
                  </span>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                  className={`absolute left-0 top-0 h-full rounded-full ${
                    isOverBudget 
                      ? 'bg-gradient-to-r from-red-400 to-red-500' 
                      : `bg-gradient-to-r from-stone-300 to-stone-400`
                  }`}
                  style={{ 
                    background: !isOverBudget 
                      ? `linear-gradient(90deg, ${cat.color}88, ${cat.color})` 
                      : undefined 
                  }}
                />
                
                {/* 예산 기준선 */}
                {isOverBudget && (
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-stone-400"
                    style={{ left: `${(cat.budget / cat.spent) * 100}%` }}
                  />
                )}
              </div>

              {/* 초과 경고 */}
              {isOverBudget && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-red-500 font-medium">
                    {formatMoney(cat.spent - cat.budget)} 초과
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
```

---

## 4. 타이포그래피 시스템

### 현재 문제
- 폰트 크기가 불규칙
- 숫자와 텍스트가 구분 안됨
- 계층이 불명확

### 프로 타이포그래피 스케일

```css
/* styles/typography.css */

:root {
  /* 폰트 패밀리 */
  --font-display: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', 'Roboto Mono', monospace;

  /* 폰트 크기 스케일 (1.25 ratio) */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */

  /* 폰트 웨이트 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;

  /* 행간 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* 자간 */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}

/* 제목 스타일 */
.heading-1 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: #1c1917;
}

.heading-2 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: #1c1917;
}

.heading-3 {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: #292524;
}

/* 본문 스타일 */
.body-lg {
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: #57534e;
}

.body-sm {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: #78716c;
}

/* 숫자/금액 스타일 */
.number-display {
  font-family: var(--font-mono);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-tight);
  font-variant-numeric: tabular-nums;
  color: #1c1917;
}

.number-large {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  font-variant-numeric: tabular-nums;
}

.number-small {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-variant-numeric: tabular-nums;
}

/* 라벨/캡션 */
.label {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: #a8a29e;
}

.caption {
  font-size: var(--text-xs);
  color: #a8a29e;
}
```

### Tailwind 적용

```tsx
// 숫자 표시 컴포넌트
const MoneyDisplay: React.FC<{ amount: number; size?: 'sm' | 'md' | 'lg' }> = ({ 
  amount, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <span className={`
      font-mono font-bold tracking-tight tabular-nums
      ${sizeClasses[size]}
    `}>
      {new Intl.NumberFormat('ko-KR', { 
        style: 'currency', 
        currency: 'KRW',
        maximumFractionDigits: 0,
      }).format(amount)}
    </span>
  );
};
```

---

## 5. 색상 시스템 (의미 기반)

### 현재 문제
- 색상이 장식적으로만 사용됨
- 상태를 나타내는 색상이 불분명

### 프로 색상 시스템

```tsx
// tailwind.config.js 확장

const colors = {
  // 브랜드
  brand: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',  // Primary
    600: '#e11d48',
    700: '#be123c',
  },

  // 시맨틱 (의미 기반)
  semantic: {
    // 성공/완료
    success: {
      light: '#dcfce7',
      DEFAULT: '#22c55e',
      dark: '#166534',
    },
    // 경고
    warning: {
      light: '#fef3c7',
      DEFAULT: '#f59e0b',
      dark: '#92400e',
    },
    // 오류/초과
    error: {
      light: '#fee2e2',
      DEFAULT: '#ef4444',
      dark: '#991b1b',
    },
    // 정보
    info: {
      light: '#dbeafe',
      DEFAULT: '#3b82f6',
      dark: '#1e40af',
    },
  },

  // 중립
  neutral: {
    bg: '#fafaf9',
    card: '#ffffff',
    border: '#e7e5e4',
    text: {
      primary: '#1c1917',
      secondary: '#57534e',
      tertiary: '#a8a29e',
      disabled: '#d6d3d1',
    },
  },
};

// 사용 예시
// ✅ Good: 의미 기반
<span className="text-semantic-success">완료</span>
<span className="text-semantic-error">초과</span>

// ❌ Bad: 임의 색상
<span className="text-green-500">완료</span>
<span className="text-red-500">초과</span>
```

---

## 6. 그리드 시스템 & 여백

### 8px 그리드 시스템

```tsx
// 일관된 간격 사용
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px  ← 기본 단위
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
};

// 섹션 간격
<div className="space-y-8">  {/* 32px */}
  <section>...</section>
  <section>...</section>
</div>

// 카드 내부
<div className="p-6">  {/* 24px */}
  <h3 className="mb-4">...</h3>  {/* 16px */}
  <div className="space-y-3">  {/* 12px */}
    ...
  </div>
</div>

// 인라인 요소
<div className="flex items-center gap-2">  {/* 8px */}
  <Icon />
  <span>텍스트</span>
</div>
```

---

## 7. 컴팩트 헤더

### 현재 vs 개선

```tsx
// 현재: 커플 사진 + 이름 + D-day가 큰 영역 차지

// 개선: 컴팩트 상단 바
const CompactHeader: React.FC = () => (
  <div className="flex items-center justify-between py-4">
    {/* 좌측: 브랜드 */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
        <Heart className="w-5 h-5 text-white" fill="white" />
      </div>
      <div>
        <h1 className="font-bold text-stone-800">Needless Wedding</h1>
        <p className="text-xs text-stone-400">민수 & 지영</p>
      </div>
    </div>

    {/* 우측: D-day + 액션 */}
    <div className="flex items-center gap-4">
      <div className="text-right">
        <span className="text-2xl font-bold text-rose-500">D-281</span>
        <p className="text-xs text-stone-400">2026.10.03</p>
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-xl hover:bg-stone-100">
          <Bell className="w-5 h-5 text-stone-400" />
        </button>
        <button className="p-2 rounded-xl hover:bg-stone-100">
          <Settings className="w-5 h-5 text-stone-400" />
        </button>
      </div>
    </div>
  </div>
);
```

---

## 8. 최근 활동 & 일정 (2열 그리드)

```tsx
// components/dashboard/RecentActivity.tsx

const RecentActivityGrid: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* 최근 지출 */}
    <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800">최근 지출</h3>
        <button className="text-xs text-rose-500 hover:text-rose-600">
          전체 보기
        </button>
      </div>

      <div className="space-y-3">
        {recentExpenses.map((expense, i) => (
          <div 
            key={expense.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              ${expense.paidBy === 'groom' ? 'bg-blue-100 text-blue-600' : 
                expense.paidBy === 'bride' ? 'bg-rose-100 text-rose-600' : 
                'bg-stone-100 text-stone-600'}
            `}>
              {getCategoryIcon(expense.category)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 truncate">{expense.title}</p>
              <p className="text-xs text-stone-400">{expense.date}</p>
            </div>
            <span className="font-mono font-semibold text-stone-800">
              {formatMoney(expense.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>

    {/* 다가오는 일정 */}
    <div className="bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800">다가오는 일정</h3>
        <button className="text-xs text-rose-500 hover:text-rose-600">
          전체 보기
        </button>
      </div>

      <div className="space-y-3">
        {upcomingEvents.map((event, i) => (
          <div 
            key={event.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors"
          >
            {/* 날짜 블록 */}
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex flex-col items-center justify-center">
              <span className="text-xs text-rose-400 font-medium">
                {getMonth(event.date)}
              </span>
              <span className="text-lg font-bold text-rose-600">
                {getDay(event.date)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 truncate">{event.title}</p>
              <p className="text-xs text-stone-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {event.time}
                {event.location && (
                  <>
                    <MapPin className="w-3 h-3 ml-2" />
                    {event.location}
                  </>
                )}
              </p>
            </div>
            <div className={`
              w-2 h-2 rounded-full
              ${getDaysUntil(event.date) <= 3 ? 'bg-red-500' : 
                getDaysUntil(event.date) <= 7 ? 'bg-amber-500' : 'bg-emerald-500'}
            `} />
          </div>
        ))}
      </div>
    </div>
  </div>
);
```

---

## 9. 전체 대시보드 조합

```tsx
// pages/Dashboard.tsx (프로 버전)

import React from 'react';
import { motion } from 'framer-motion';
import { CompactHeader } from '../components/dashboard/CompactHeader';
import { KPIGrid } from '../components/dashboard/KPICards';
import { BudgetDonutChart } from '../components/dashboard/BudgetInsights';
import { CategoryBars } from '../components/dashboard/CategoryBars';
import { RecentActivityGrid } from '../components/dashboard/RecentActivity';

const Dashboard: React.FC = () => {
  // 데이터 훅들...

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        
        {/* 컴팩트 헤더 */}
        <CompactHeader />

        {/* 메인 콘텐츠 */}
        <div className="space-y-6 mt-6">
          
          {/* KPI 카드 그리드 */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <KPIGrid 
              dDay={dDay}
              totalBudget={budget.totalBudget}
              spent={totalSpent}
              checklistProgress={checklistProgress}
              overBudgetCount={overBudgetCategories.length}
            />
          </motion.section>

          {/* 예산 시각화 (2열) */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* 도넛 차트 (2칸) */}
            <div className="lg:col-span-2">
              <BudgetDonutChart 
                categories={budget.categories}
                totalBudget={budget.totalBudget}
                totalSpent={totalSpent}
              />
            </div>

            {/* 카테고리 바 (3칸) */}
            <div className="lg:col-span-3">
              <CategoryBars 
                categories={budget.categories}
                onCategoryClick={(name) => navigate(`/budget?category=${name}`)}
              />
            </div>
          </motion.section>

          {/* 최근 활동 & 일정 (2열) */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <RecentActivityGrid 
              expenses={recentExpenses}
              events={upcomingEvents}
            />
          </motion.section>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## 📊 Before / After 비교

| 항목 | Before | After |
|------|--------|-------|
| 정보 밀도 | 스크롤 3~4회 | 1~2회로 충분 |
| KPI 가시성 | 숫자가 작음 | 크고 명확함 |
| 차트 효율 | 거대하고 단순 | 컴팩트하고 인사이트 제공 |
| 색상 의미 | 장식적 | 상태 기반 |
| 타이포그래피 | 불규칙 | 체계적 스케일 |
| 여백 | 들쭉날쭉 | 8px 그리드 |
| 애니메이션 | 없거나 과함 | 섬세하고 의미있음 |

---

## 🎯 구현 우선순위

| 순위 | 항목 | 작업량 | 임팩트 |
|------|------|--------|--------|
| 1 | KPI 카드 개선 | 🟢 2시간 | ⭐⭐⭐⭐⭐ |
| 2 | 타이포그래피 정리 | 🟢 1시간 | ⭐⭐⭐⭐ |
| 3 | 색상 시스템 적용 | 🟢 1시간 | ⭐⭐⭐⭐ |
| 4 | 컴팩트 헤더 | 🟡 2시간 | ⭐⭐⭐⭐ |
| 5 | 예산 차트 개선 | 🟡 3시간 | ⭐⭐⭐⭐ |
| 6 | 카테고리 바 | 🟡 2시간 | ⭐⭐⭐ |
| 7 | 최근 활동 그리드 | 🟡 2시간 | ⭐⭐⭐ |

---

*작성일: 2025-12-28*
*버전: 1.0*
