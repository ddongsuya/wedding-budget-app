# 빈 상태(Empty State) UI 가이드

## 개요
사용자 경험 향상을 위해 데이터가 없거나 검색 결과가 없을 때 친근하고 행동을 유도하는 빈 상태 UI를 구현했습니다.

## 구현된 컴포넌트

### 1. EmptyState (기본 빈 상태 컴포넌트)
**위치**: `src/components/common/EmptyState/EmptyState.tsx`

**기능**:
- 귀여운 일러스트레이션 또는 아이콘 표시
- 명확한 타이틀과 설명
- 주요 액션 버튼 (Primary CTA)
- 보조 액션 버튼 (Secondary CTA)

**Props**:
```typescript
interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;           // 아이콘 (일러스트 대신)
  illustration?: 'wedding' | 'budget' | 'expense' | 'venue' | 'checklist' | 'calendar';
  title: string;                           // 제목 (필수)
  description?: string;                    // 설명
  actionLabel?: string;                    // 주요 버튼 텍스트
  onAction?: () => void;                   // 주요 버튼 클릭 핸들러
  secondaryActionLabel?: string;           // 보조 버튼 텍스트
  onSecondaryAction?: () => void;          // 보조 버튼 클릭 핸들러
  className?: string;                      // 추가 스타일
}
```

**사용 예시**:
```tsx
import { EmptyState } from '../src/components/common/EmptyState';

<EmptyState
  illustration="expense"
  title="아직 기록된 지출이 없어요"
  description="결혼 준비 비용을 기록하고 예산을 관리해보세요"
  actionLabel="첫 지출 기록하기"
  onAction={() => openExpenseModal()}
/>
```

### 2. EmptyStateIllustration (일러스트레이션)
**위치**: `src/components/common/EmptyState/EmptyStateIllustration.tsx`

**제공되는 일러스트레이션**:

#### wedding (결혼/웨딩)
- 하트 모양과 리본
- 핑크/로즈 톤
- 사용처: 커플 연결 전, 프로필 미설정

#### budget (예산)
- 지갑과 동전
- 옐로우/골드 톤
- 사용처: 예산 미설정, 카테고리 없음

#### expense (지출)
- 영수증과 플러스 아이콘
- 그린/민트 톤
- 사용처: 지출 내역 없음

#### venue (식장)
- 웨딩홀 건물
- 핑크/로즈 톤
- 사용처: 등록된 식장 없음

#### checklist (체크리스트)
- 클립보드와 체크마크
- 퍼플/라벤더 톤
- 사용처: 할일 목록 없음 (미래 기능)

#### calendar (캘린더)
- 달력과 하트 날짜
- 블루/스카이 톤
- 사용처: 일정 없음 (미래 기능)

### 3. NoSearchResults (검색 결과 없음)
**위치**: `src/components/common/EmptyState/NoSearchResults.tsx`

**기능**:
- 검색어 표시
- 검색어 지우기 버튼

**사용 예시**:
```tsx
import { NoSearchResults } from '../src/components/common/EmptyState';

<NoSearchResults
  searchTerm={searchTerm}
  onClear={() => setSearchTerm('')}
/>
```

### 4. ErrorState (에러 상태)
**위치**: `src/components/common/EmptyState/ErrorState.tsx`

**기능**:
- 에러 아이콘 표시
- 에러 메시지
- 재시도 버튼

**사용 예시**:
```tsx
import { ErrorState } from '../src/components/common/EmptyState';

<ErrorState
  title="데이터를 불러올 수 없어요"
  message="네트워크 연결을 확인하고 다시 시도해주세요"
  onRetry={() => refetchData()}
/>
```

## 적용된 페이지

### 1. 지출 목록 (pages/Expenses.tsx)

#### 지출이 전혀 없을 때
```tsx
{expenses.length === 0 && (
  <EmptyState
    illustration="expense"
    title="아직 기록된 지출이 없어요"
    description="결혼 준비 비용을 기록하고 예산을 관리해보세요"
    actionLabel="첫 지출 기록하기"
    onAction={() => { setEditingExpense(null); setIsFormOpen(true); }}
  />
)}
```

#### 검색 결과가 없을 때
```tsx
{filteredExpenses.length === 0 && (
  <NoSearchResults
    searchTerm={searchTerm}
    onClear={() => setSearchTerm('')}
  />
)}
```

### 2. 식장 목록 (pages/Venues.tsx)

#### 등록된 식장이 없을 때 (모바일 & 데스크톱)
```tsx
{venues.length === 0 ? (
  <EmptyState
    illustration="venue"
    title="아직 등록된 식장이 없어요"
    description="마음에 드는 웨딩홀을 등록하고 비교해보세요"
    actionLabel="첫 식장 등록하기"
    onAction={() => { setEditingVenue(null); setIsFormOpen(true); }}
  />
) : processedVenues.length === 0 ? (
  <NoSearchResults
    searchTerm={searchTerm}
    onClear={() => setSearchTerm('')}
  />
) : (
  // 식장 목록 표시
)}
```

### 3. 예산 관리 (pages/Budget.tsx)

#### 예산 카테고리가 없을 때
```tsx
{budget.categories.length === 0 ? (
  <EmptyState
    illustration="budget"
    title="예산 카테고리를 추가해주세요"
    description="식장, 스드메, 예복 등 항목별로 예산을 배분해보세요"
    actionLabel="카테고리 추가하기"
    onAction={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
  />
) : (
  // 카테고리 목록 표시
)}
```

## 디자인 가이드라인

### 색상 팔레트
각 일러스트레이션은 앱의 베이지/로즈골드 톤과 조화를 이루도록 설계되었습니다:

- **Wedding**: 핑크/로즈 (#FFF1F2, #FDA4AF, #E11D48)
- **Budget**: 옐로우/골드 (#FEF3C7, #FCD34D, #F59E0B)
- **Expense**: 그린/민트 (#ECFDF5, #6EE7B7, #10B981)
- **Venue**: 핑크/로즈 (#FFF1F2, #FECDD3, #FDA4AF)
- **Checklist**: 퍼플/라벤더 (#EDE9FE, #C4B5FD, #8B5CF6)
- **Calendar**: 블루/스카이 (#DBEAFE, #93C5FD, #3B82F6)

### 문구 작성 원칙

#### ✅ 좋은 예시
- "아직 기록된 지출이 없어요"
- "마음에 드는 웨딩홀을 등록하고 비교해보세요"
- "첫 지출 기록하기"

#### ❌ 피해야 할 예시
- "데이터가 없습니다"
- "지출을 추가하세요"
- "확인"

**원칙**:
1. 부정적이지 않고 긍정적인 톤
2. 친근하고 대화하는 느낌 ("~해요", "~보세요")
3. 명확한 행동 유도 ("첫 ~하기", "~추가하기")

### 버튼 스타일

#### Primary Action (주요 액션)
```css
bg-gradient-to-r from-rose-400 to-rose-500
hover:from-rose-500 hover:to-rose-600
shadow-lg shadow-rose-200
transform hover:scale-105
```
- 그라데이션 로즈 컬러
- 호버 시 확대 효과
- 그림자로 입체감

#### Secondary Action (보조 액션)
```css
bg-stone-100
hover:bg-stone-200
```
- 중립적인 회색 톤
- 주요 액션보다 덜 강조

## 애니메이션

모든 빈 상태 컴포넌트는 `animate-fade-in` 클래스를 사용하여 부드럽게 나타납니다:

```css
@keyframes fadeIn {
  '0%': { opacity: '0' },
  '100%': { opacity: '1' },
}
```

## 반응형 디자인

- **모바일**: 세로 레이아웃, 버튼 전체 너비
- **데스크톱**: 가로 레이아웃 (버튼), 중앙 정렬

```tsx
<div className="flex flex-col sm:flex-row gap-3">
  {/* 버튼들 */}
</div>
```

## 사용 시나리오별 가이드

### 시나리오 1: 완전히 비어있는 상태
**사용**: `EmptyState` with illustration
```tsx
<EmptyState
  illustration="expense"
  title="아직 기록된 지출이 없어요"
  description="결혼 준비 비용을 기록하고 예산을 관리해보세요"
  actionLabel="첫 지출 기록하기"
  onAction={handleAdd}
/>
```

### 시나리오 2: 검색/필터 결과 없음
**사용**: `NoSearchResults`
```tsx
<NoSearchResults
  searchTerm={searchTerm}
  onClear={() => setSearchTerm('')}
/>
```

### 시나리오 3: 에러 발생
**사용**: `ErrorState`
```tsx
<ErrorState
  title="데이터를 불러올 수 없어요"
  message="네트워크 연결을 확인하고 다시 시도해주세요"
  onRetry={refetch}
/>
```

### 시나리오 4: 아이콘만 사용
**사용**: `EmptyState` with icon
```tsx
import { Inbox } from 'lucide-react';

<EmptyState
  icon={Inbox}
  title="받은 알림이 없어요"
  description="새로운 알림이 오면 여기에 표시됩니다"
/>
```

## 접근성 (Accessibility)

### 현재 구현
- 시맨틱 HTML 사용 (`<h3>`, `<p>`, `<button>`)
- 명확한 버튼 텍스트
- 충분한 색상 대비

### 향후 개선 사항
- [ ] `aria-label` 추가
- [ ] 스크린 리더 테스트
- [ ] 키보드 네비게이션 최적화

## 테스트 체크리스트

- [x] 지출 목록 빈 상태 표시
- [x] 지출 검색 결과 없음 표시
- [x] 식장 목록 빈 상태 표시 (모바일)
- [x] 식장 목록 빈 상태 표시 (데스크톱)
- [x] 식장 검색 결과 없음 표시
- [x] 예산 카테고리 빈 상태 표시
- [x] 모바일 반응형 확인
- [x] 데스크톱 반응형 확인
- [x] 버튼 클릭 동작 확인
- [x] 애니메이션 확인

## 향후 확장 계획

### 추가 일러스트레이션
- [ ] `notification` - 알림 없음
- [ ] `message` - 메시지 없음
- [ ] `photo` - 사진 없음

### 추가 기능
- [ ] 로딩 상태와 빈 상태 전환 애니메이션
- [ ] 다크모드 지원
- [ ] 일러스트레이션 애니메이션 (미세한 움직임)
- [ ] 커스텀 일러스트레이션 업로드

## 파일 구조

```
src/
└── components/
    └── common/
        └── EmptyState/
            ├── index.ts                      # Export 모음
            ├── EmptyState.tsx                # 기본 빈 상태 컴포넌트
            ├── EmptyStateIllustration.tsx    # SVG 일러스트레이션
            ├── NoSearchResults.tsx           # 검색 결과 없음
            └── ErrorState.tsx                # 에러 상태
```

## 관련 문서
- [스켈레톤 로딩 가이드](./SKELETON_LOADING_GUIDE.md)
- [토스트 알림 가이드](./TOAST_NOTIFICATION_GUIDE.md)
- [PWA 설정 가이드](./PWA_SETUP.md)
