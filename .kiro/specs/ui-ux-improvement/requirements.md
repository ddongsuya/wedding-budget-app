# Requirements Document

## Introduction

Needless Wedding 웹 애플리케이션의 UI/UX 개선 프로젝트입니다. 개선 리포트에서 식별된 미구현 항목들을 구현하여 사용자 경험을 향상시킵니다. 주요 개선 영역은 Dashboard 탭 네비게이션, Budget 리스트 뷰, Checklist 드롭다운 필터 및 원형 진행률, Schedule 주간 뷰입니다.

## Glossary

- **Tab_Navigation**: 콘텐츠를 탭으로 분리하여 한 화면에 표시되는 정보량을 줄이는 UI 패턴
- **List_View**: 항목들을 세로로 나열하는 레이아웃 형태
- **Grid_View**: 항목들을 격자 형태로 배치하는 레이아웃 형태
- **Dropdown_Filter**: 클릭 시 펼쳐지는 선택 목록 형태의 필터 UI
- **Circular_Progress**: 원형으로 진행률을 표시하는 UI 컴포넌트
- **Week_View**: 7일 단위로 일정을 표시하는 캘린더 뷰
- **Progressive_Disclosure**: 처음에는 요약만 보여주고 사용자 액션에 따라 상세 정보를 표시하는 UX 패턴
- **Collapsible_Section**: 접기/펼치기가 가능한 섹션 UI

## Requirements

### Requirement 1: Dashboard 탭 네비게이션

**User Story:** As a user, I want to view dashboard content in organized tabs, so that I can focus on specific information without scrolling through everything.

#### Acceptance Criteria

1. WHEN the Dashboard page loads THEN the System SHALL display a tab navigation with three tabs: 요약, 예산, 일정
2. WHEN a user clicks on a tab THEN the System SHALL display only the content relevant to that tab
3. WHEN the 요약 tab is selected THEN the System SHALL display the couple card, summary cards, and recent expenses
4. WHEN the 예산 tab is selected THEN the System SHALL display budget charts and category breakdown
5. WHEN the 일정 tab is selected THEN the System SHALL display upcoming events and schedule summary
6. THE System SHALL persist the selected tab state during the session

### Requirement 2: Budget 리스트 뷰 및 비활성 카테고리 접기

**User Story:** As a user, I want to see budget categories in a compact list format with inactive categories hidden, so that I can focus on categories I'm actively using.

#### Acceptance Criteria

1. WHEN the Budget page loads THEN the System SHALL display categories in a vertical list format instead of grid
2. WHEN displaying categories THEN the System SHALL show icon, name, spent amount, budget amount, and progress bar in each list item
3. WHEN there are categories with zero spending THEN the System SHALL group them as inactive categories
4. WHEN inactive categories exist THEN the System SHALL display a toggle button showing the count of inactive categories
5. WHEN a user clicks the inactive categories toggle THEN the System SHALL expand or collapse the inactive category section
6. THE inactive categories section SHALL be collapsed by default

### Requirement 3: Checklist 드롭다운 필터

**User Story:** As a user, I want to filter checklist items using a dropdown menu, so that I can quickly select a category without horizontal scrolling.

#### Acceptance Criteria

1. WHEN the Checklist page loads THEN the System SHALL display a dropdown filter button instead of horizontal scroll buttons
2. WHEN a user clicks the filter button THEN the System SHALL display a dropdown menu with all categories
3. WHEN a user selects a category from the dropdown THEN the System SHALL filter items to show only that category
4. WHEN a category is selected THEN the System SHALL display the selected category name on the filter button
5. WHEN a user clicks outside the dropdown THEN the System SHALL close the dropdown menu
6. THE dropdown menu SHALL include an option to show all categories

### Requirement 4: Checklist 원형 진행률

**User Story:** As a user, I want to see my checklist progress in a circular format, so that I can quickly understand my overall completion status.

#### Acceptance Criteria

1. WHEN the Checklist page displays progress THEN the System SHALL show a circular progress indicator
2. THE circular progress indicator SHALL display the completion percentage in the center
3. THE circular progress indicator SHALL use a gradient color from rose-400 to rose-500
4. WHEN progress changes THEN the System SHALL animate the circular progress smoothly
5. THE circular progress SHALL be sized appropriately for both mobile and desktop views

### Requirement 5: Schedule 주간 뷰

**User Story:** As a user, I want to see my schedule in a weekly view by default, so that I can focus on upcoming events without navigating through a full month calendar.

#### Acceptance Criteria

1. WHEN the Schedule page loads THEN the System SHALL display a week view as the default view
2. THE week view SHALL display 7 days starting from the current week
3. WHEN a day in the week view has events THEN the System SHALL display event indicators
4. WHEN a user clicks on a day in the week view THEN the System SHALL show events for that day
5. THE System SHALL provide a toggle to switch between week view and month view
6. WHEN navigating weeks THEN the System SHALL provide previous/next week navigation buttons
7. THE week view SHALL highlight the current day

