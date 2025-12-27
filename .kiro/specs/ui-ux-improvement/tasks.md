# Implementation Tasks

## Task 1: Dashboard 탭 네비게이션 구현

**Requirements**: REQ-1

**Dependencies**: None

**Subtasks**:
- [x] 1.1 DashboardTabs 컴포넌트 생성 (`components/dashboard/DashboardTabs.tsx`)
- [x] 1.2 Dashboard.tsx에 탭 상태 추가 (activeTab state + sessionStorage 연동)
- [x] 1.3 Dashboard.tsx에 DashboardTabs 컴포넌트 통합
- [x] 1.4 탭별 콘텐츠 분리 (요약: 커플카드+요약카드+최근지출, 예산: 차트+카테고리, 일정: 일정요약)
- [x] 1.5 탭 전환 애니메이션 추가 (선택사항)

**Acceptance Criteria Verification**:
- 페이지 로드 시 3개 탭 표시 확인
- 탭 클릭 시 해당 콘텐츠만 표시 확인
- 세션 동안 탭 상태 유지 확인

---

## Task 2: Budget 리스트 뷰 구현

**Requirements**: REQ-2

**Dependencies**: None

**Subtasks**:
- [x] 2.1 CategoryListItem 컴포넌트 생성 (`components/budget/CategoryListItem.tsx`)
- [x] 2.2 BudgetListView 컴포넌트 생성 (`components/budget/BudgetListView.tsx`)
- [x] 2.3 Budget.tsx에서 기존 그리드 뷰를 BudgetListView로 교체
- [x] 2.4 활성/비활성 카테고리 분리 로직 구현
- [x] 2.5 비활성 카테고리 토글 버튼 및 접기/펼치기 기능 구현

**Acceptance Criteria Verification**:
- 카테고리가 세로 리스트로 표시 확인
- 지출 없는 카테고리가 비활성으로 분류 확인
- 토글 버튼 클릭 시 비활성 카테고리 펼침/접힘 확인
- 기본 상태에서 비활성 카테고리 접힘 확인

---

## Task 3: Checklist 드롭다운 필터 구현

**Requirements**: REQ-3

**Dependencies**: None

**Subtasks**:
- [x] 3.1 CategoryDropdown 컴포넌트 생성 (`components/checklist/CategoryDropdown.tsx`)
- [x] 3.2 외부 클릭 감지 훅 구현 (useClickOutside)
- [x] 3.3 Checklist.tsx에서 기존 가로 스크롤 버튼을 CategoryDropdown으로 교체
- [x] 3.4 드롭다운 메뉴 스타일링 및 애니메이션 적용
- [x] 3.5 "전체" 옵션 포함 및 선택된 카테고리 표시

**Acceptance Criteria Verification**:
- 드롭다운 버튼 클릭 시 메뉴 표시 확인
- 카테고리 선택 시 필터링 동작 확인
- 외부 클릭 시 드롭다운 닫힘 확인
- 선택된 카테고리명 버튼에 표시 확인

---

## Task 4: Checklist 원형 진행률 구현

**Requirements**: REQ-4

**Dependencies**: None

**Subtasks**:
- [x] 4.1 CircularProgress 컴포넌트 생성 (`components/checklist/CircularProgress.tsx`)
- [x] 4.2 SVG 원형 진행률 구현 (stroke-dasharray, stroke-dashoffset)
- [x] 4.3 그라데이션 색상 적용 (rose-400 → rose-500)
- [x] 4.4 중앙 퍼센트 텍스트 표시
- [x] 4.5 Checklist.tsx에서 기존 진행률 바를 CircularProgress로 교체
- [x] 4.6 진행률 변경 시 애니메이션 적용

**Acceptance Criteria Verification**:
- 원형 진행률 표시 확인
- 중앙에 퍼센트 표시 확인
- 그라데이션 색상 적용 확인
- 진행률 변경 시 부드러운 애니메이션 확인

---

## Task 5: Schedule 주간 뷰 구현

**Requirements**: REQ-5

**Dependencies**: None

**Subtasks**:
- [x] 5.1 WeekView 컴포넌트 생성 (`components/schedule/WeekView.tsx`)
- [x] 5.2 현재 주의 7일 계산 로직 구현 (date-fns 활용)
- [x] 5.3 날짜별 이벤트 표시 (점 인디케이터)
- [x] 5.4 오늘 날짜 하이라이트 스타일 적용
- [x] 5.5 이전/다음 주 네비게이션 버튼 구현
- [x] 5.6 Schedule.tsx에 viewMode 상태 추가 (week/month)
- [x] 5.7 Schedule.tsx에 WeekView 통합 및 뷰 모드 토글 버튼 추가
- [x] 5.8 기본 뷰를 주간 뷰로 설정

**Acceptance Criteria Verification**:
- 페이지 로드 시 주간 뷰 기본 표시 확인
- 7일 표시 및 오늘 날짜 하이라이트 확인
- 이벤트 있는 날짜에 인디케이터 표시 확인
- 날짜 클릭 시 해당 날짜 이벤트 표시 확인
- 주간/월간 뷰 전환 토글 동작 확인
- 이전/다음 주 네비게이션 동작 확인

---

## Implementation Status: ✅ COMPLETE

모든 5개 태스크가 완료되었습니다:
1. Dashboard 탭 네비게이션 - 요약/예산/일정 탭으로 콘텐츠 분리
2. Budget 리스트 뷰 - 그리드에서 리스트로 변경, 비활성 카테고리 접기
3. Checklist 드롭다운 필터 - 가로 스크롤에서 드롭다운으로 변경
4. Checklist 원형 진행률 - 바 형태에서 원형으로 변경
5. Schedule 주간 뷰 - 기본 뷰를 주간으로 설정, 월간 뷰 토글 추가
