# 요구사항 문서: 베타 배포 준비 종합 리뷰

## 소개

웨딩 예산 관리 앱(Wedding Planner)의 베타 배포 전 종합 리뷰 문서입니다. 코드베이스 전체를 분석하여 보완해야 할 점, 개선해야 할 점, 추가해야 할 점, 기능 간 연결성 문제를 사용자 편의성 관점에서 정리합니다.

## 용어 정의

- **App**: Wedding Planner 웨딩 예산 관리 앱 전체 시스템
- **Dashboard**: 메인 대시보드 페이지
- **Budget_Manager**: 예산 관리 모듈 (카테고리별 예산 배분 및 추적)
- **Expense_Tracker**: 지출 관리 모듈 (지출 등록, 수정, 삭제, 필터링)
- **Venue_Manager**: 예식장 관리 모듈 (등록, 비교, 계약)
- **Checklist_Manager**: 체크리스트 모듈 (D-day 기반 할일 관리)
- **Schedule_Manager**: 일정 관리 모듈 (캘린더, 이벤트)
- **Photo_Manager**: 포토 레퍼런스 모듈 (스냅 촬영 참고 사진)
- **Notification_System**: 알림 시스템 (푸시, 인앱 알림)
- **Couple_System**: 커플 연동 시스템 (초대 코드, 데이터 공유)
- **Settings_Manager**: 설정 모듈 (프로필, 앱 설정, 계정)
- **Navigation_System**: 네비게이션 시스템 (라우팅, 하단 탭, 사이드바)
- **Auth_System**: 인증 시스템 (로그인, 회원가입, 비밀번호)

## 요구사항

---

### 요구사항 1: 예산-지출 간 데이터 연결성 강화

**사용자 스토리:** 사용자로서, 예산 카테고리에서 해당 카테고리의 지출 내역을 바로 확인하고 싶다. 예산과 지출이 유기적으로 연결되어야 한다.

#### 수용 기준

1. WHEN 사용자가 Budget_Manager에서 카테고리를 클릭하면, THE App SHALL 해당 카테고리의 지출 목록을 필터링하여 Expense_Tracker 페이지로 이동한다.
2. WHEN 사용자가 Expense_Tracker에서 지출을 등록하면, THE Budget_Manager SHALL 해당 카테고리의 지출 합계를 실시간으로 갱신한다.
3. WHEN 사용자가 Dashboard에서 카테고리 바를 클릭하면, THE App SHALL 해당 카테고리의 상세 지출 내역을 표시한다.
4. THE Expense_Tracker SHALL 지출 목록 상단에 현재 필터링된 카테고리의 예산 대비 지출 진행률 바를 표시한다.
5. WHEN 예산 초과 카테고리가 존재하면, THE Dashboard SHALL 초과 카테고리 알림에서 해당 카테고리 지출 내역으로 직접 이동하는 링크를 제공한다.

---

### 요구사항 2: 예식장-지출-일정 간 연결성 구축

**사용자 스토리:** 사용자로서, 예식장 계약 시 관련 지출과 일정이 자동으로 연동되어 별도로 입력하지 않아도 되길 원한다.

#### 수용 기준

1. WHEN 사용자가 Venue_Manager에서 계약을 확정하면, THE App SHALL 계약금 정보를 Expense_Tracker에 자동으로 등록할 것인지 확인 다이얼로그를 표시한다.
2. WHEN 사용자가 Venue_Manager에서 방문 예정 식장이 있으면, THE App SHALL 해당 방문 일정을 Schedule_Manager에 추가할 것인지 제안한다.
3. THE Venue_Manager SHALL 계약 완료된 식장의 총 비용을 Budget_Manager의 "예식장" 카테고리 지출과 연동하여 표시한다.
4. WHEN 사용자가 Venue_Manager에서 식장 상세를 볼 때, THE App SHALL 해당 식장 관련 지출 내역과 일정을 함께 표시한다.

---

### 요구사항 3: 체크리스트-일정-지출 간 연결성 구축

**사용자 스토리:** 사용자로서, 체크리스트 항목 완료 시 관련 일정이나 지출을 바로 등록할 수 있어야 한다.

#### 수용 기준

1. WHEN 사용자가 Checklist_Manager에서 항목을 완료 처리하면, THE App SHALL "관련 지출 등록" 또는 "관련 일정 추가" 바로가기 버튼을 표시한다.
2. THE Checklist_Manager SHALL 각 체크리스트 항목에 연관된 일정 개수와 지출 금액을 요약 표시한다.
3. WHEN 사용자가 Schedule_Manager에서 일정을 추가할 때, THE App SHALL 관련 체크리스트 항목을 선택적으로 연결할 수 있는 옵션을 제공한다.

---

### 요구사항 4: 대시보드 정보 완성도 향상

**사용자 스토리:** 사용자로서, 대시보드에서 결혼 준비 전체 현황을 한눈에 파악하고 싶다.

#### 수용 기준

1. THE Dashboard SHALL 다가오는 일정 목록(최대 3개)을 표시하고, 각 일정을 클릭하면 Schedule_Manager로 이동한다.
2. THE Dashboard SHALL 다가오는 결제 예정 지출(status=planned) 목록을 표시하고, 각 항목을 클릭하면 Expense_Tracker로 이동한다.
3. THE Dashboard SHALL 미완료 체크리스트 중 마감이 임박한 항목(현재 D-day 기준 가장 가까운 시기)을 표시한다.
4. WHEN 사용자가 Dashboard의 KPI 카드를 클릭하면, THE App SHALL 해당 상세 페이지(예산→Budget, 체크리스트→Checklist 등)로 이동한다.
5. THE Dashboard SHALL 예식장 확정 여부를 표시하고, 미확정 시 Venue_Manager로 이동하는 바로가기를 제공한다.

---

### 요구사항 5: 지출 관리 기능 보완

**사용자 스토리:** 사용자로서, 지출 내역을 더 체계적으로 관리하고 분석하고 싶다.

#### 수용 기준

1. THE Expense_Tracker SHALL 월별 지출 추이 차트(간단한 바 차트 또는 라인 차트)를 제공한다.
2. THE Expense_Tracker SHALL 결제 예정(planned) 지출과 결제 완료(completed) 지출을 탭으로 분리하여 표시한다.
3. WHEN 결제 예정 지출의 예정일이 3일 이내로 다가오면, THE Notification_System SHALL 사용자에게 결제 예정 알림을 발송한다.
4. THE Expense_Tracker SHALL 지출 목록을 CSV 또는 엑셀 형식으로 내보내기(Export) 기능을 제공한다.
5. WHEN 사용자가 Expense_Tracker에서 "결제 예정" 지출을 "결제 완료"로 변경하면, THE App SHALL 결제일을 현재 날짜로 자동 설정하고 확인을 요청한다.

---

### 요구사항 6: 예식장 관리 UX 보완

**사용자 스토리:** 사용자로서, 예식장 비교와 관리를 더 편리하게 하고 싶다.

#### 수용 기준

1. THE Venue_Manager SHALL 모바일에서 식장 카드 스와이프 시 현재 카드 번호와 전체 카드 수를 표시한다 (예: 2/5).
2. THE Venue_Manager SHALL 식장 비교 시 항목별 최저가/최고가를 하이라이트 표시한다.
3. WHEN 사용자가 식장을 "제외됨" 상태로 변경하면, THE Venue_Manager SHALL 제외 사유를 입력할 수 있는 필드를 제공한다.
4. THE Venue_Manager SHALL 식장 목록에서 방문일 기준 정렬 옵션을 제공한다.
5. WHEN 사용자가 Venue_Manager에서 계약 정보를 입력 중 앱을 벗어나면, THE App SHALL 임시 저장된 데이터를 유지하고 복원 여부를 확인한다.

---

### 요구사항 7: 설정 및 프로필 기능 보완

**사용자 스토리:** 사용자로서, 프로필 설정이 앱 전체에 일관되게 반영되고, 데이터를 안전하게 관리하고 싶다.

#### 수용 기준

1. WHEN 사용자가 Settings_Manager에서 결혼 예정일을 변경하면, THE App SHALL Dashboard의 D-day, Checklist_Manager의 시기 계산, Notification_System의 D-day 알림을 모두 갱신한다.
2. THE Settings_Manager SHALL 전체 데이터 백업(내보내기) 기능을 제공한다 (JSON 형식).
3. THE Settings_Manager SHALL 데이터 복원(가져오기) 기능을 제공한다.
4. THE Settings_Manager SHALL 계정 삭제(회원 탈퇴) 기능을 제공하고, 삭제 전 확인 절차를 2단계로 진행한다.
5. WHEN 사용자가 다크 모드를 활성화하면, THE App SHALL 전체 UI에 다크 테마를 적용한다 (현재 "준비중" 상태 해결).

---

### 요구사항 8: 네비게이션 및 페이지 접근성 개선

**사용자 스토리:** 사용자로서, 모든 페이지에 일관된 방식으로 접근하고, 현재 위치를 명확히 알고 싶다.

#### 수용 기준

1. THE Navigation_System SHALL 알림 센터, 알림 설정, 커플 연결, 공지사항 페이지에 Layout 컴포넌트(헤더, 하단 탭)를 적용한다.
2. THE Navigation_System SHALL 모든 하위 페이지(비밀번호 변경, 알림 센터 등)에 일관된 뒤로가기 네비게이션을 제공한다.
3. THE App SHALL 모바일 하단 탭의 "더보기" 메뉴에서 현재 활성 페이지를 시각적으로 표시한다.
4. WHEN 사용자가 모바일에서 FAB(빠른 추가) 버튼을 사용하면, THE App SHALL 체크리스트 항목 추가 옵션도 FAB 메뉴에 포함한다.
5. THE App SHALL 페이지 전환 시 부드러운 트랜지션 애니메이션을 적용한다.

---

### 요구사항 9: 알림 시스템 실용성 강화

**사용자 스토리:** 사용자로서, 중요한 결혼 준비 일정과 할일을 놓치지 않도록 적시에 알림을 받고 싶다.

#### 수용 기준

1. WHEN 체크리스트 항목의 마감 시기(due_period)가 현재 D-day와 일치하면, THE Notification_System SHALL 해당 항목 완료를 독촉하는 알림을 발송한다.
2. WHEN 결제 예정 지출의 예정일이 도래하면, THE Notification_System SHALL 결제 예정 알림을 발송한다.
3. WHEN 커플 파트너가 지출을 등록하거나 체크리스트를 완료하면, THE Notification_System SHALL 상대방에게 활동 알림을 발송한다.
4. THE Notification_System SHALL 알림 클릭 시 관련 페이지의 해당 항목으로 직접 이동한다 (딥링크).
5. IF 알림 발송에 실패하면, THEN THE Notification_System SHALL 실패 로그를 기록하고 다음 주기에 재시도한다.

---

### 요구사항 10: 모바일 UX 세부 보완

**사용자 스토리:** 사용자로서, 모바일에서 앱을 사용할 때 불편함 없이 모든 기능을 이용하고 싶다.

#### 수용 기준

1. THE App SHALL 모든 모달(지출 폼, 일정 폼, 체크리스트 폼, 계약 폼)에서 모바일 키보드가 올라올 때 입력 필드가 가려지지 않도록 자동 스크롤한다.
2. THE App SHALL 긴 목록(지출, 체크리스트, 일정)에서 무한 스크롤 또는 페이지네이션을 적용하여 초기 로딩 성능을 개선한다.
3. THE App SHALL 모든 삭제 동작에 confirm 대신 커스텀 ConfirmDialog 컴포넌트를 사용한다 (현재 브라우저 기본 confirm 사용 중).
4. THE App SHALL 모바일에서 날짜 입력 시 네이티브 date picker 대신 커스텀 DatePicker 컴포넌트를 일관되게 사용한다 (Schedule_Manager의 EventModal에서 네이티브 input[type=date] 사용 중).
5. WHEN 사용자가 오프라인 상태에서 데이터를 수정하면, THE App SHALL 변경 사항을 로컬에 저장하고 온라인 복귀 시 자동 동기화한다.

---

### 요구사항 11: 포토 레퍼런스 기능 확장

**사용자 스토리:** 사용자로서, 포토 레퍼런스를 더 효과적으로 관리하고 스냅 촬영 시 활용하고 싶다.

#### 수용 기준

1. THE Photo_Manager SHALL 사진에 대한 수정 기능(제목, 메모, 카테고리, 태그 변경)을 제공한다 (현재 삭제만 가능).
2. THE Photo_Manager SHALL URL을 통한 외부 이미지 추가 기능을 제공한다 (현재 파일 업로드만 가능).
3. THE Photo_Manager SHALL 사진 순서를 드래그 앤 드롭으로 변경할 수 있는 기능을 제공한다.
4. THE Photo_Manager SHALL 카테고리별 사진 개수를 필터 버튼 옆에 표시한다.
5. WHEN 사용자가 Photo_Manager에서 사진을 선택하면, THE App SHALL 좌우 스와이프로 이전/다음 사진을 탐색할 수 있는 기능을 제공한다.

---

### 요구사항 12: 데이터 유효성 및 에러 처리 강화

**사용자 스토리:** 사용자로서, 잘못된 데이터 입력 시 명확한 안내를 받고, 에러 발생 시 데이터가 손실되지 않아야 한다.

#### 수용 기준

1. THE App SHALL 모든 폼에서 필수 필드 미입력 시 해당 필드 하단에 인라인 에러 메시지를 표시한다 (현재 alert 또는 무반응).
2. WHEN API 호출이 실패하면, THE App SHALL 에러 유형에 따라 구체적인 에러 메시지를 표시한다 (네트워크 오류, 서버 오류, 인증 만료 등).
3. THE Auth_System SHALL 토큰 만료 시 자동으로 토큰을 갱신하거나, 갱신 실패 시 로그인 페이지로 리다이렉트하고 사용자에게 안내한다.
4. THE App SHALL 금액 입력 필드에서 음수 값 입력을 방지한다.
5. IF 사용자가 폼 작성 중 네트워크 연결이 끊기면, THEN THE App SHALL 작성 중인 데이터를 로컬 스토리지에 임시 저장하고 복구 옵션을 제공한다.

---

### 요구사항 13: 커플 연동 실시간 동기화

**사용자 스토리:** 사용자로서, 파트너가 변경한 내용을 실시간으로 확인하고 싶다.

#### 수용 기준

1. WHEN 커플 파트너가 데이터를 변경하면, THE Couple_System SHALL 상대방의 화면에 변경 사항을 반영한다 (페이지 새로고침 또는 폴링 방식).
2. THE Couple_System SHALL 커플 연결 상태를 Settings_Manager에서 확인할 수 있도록 표시한다.
3. WHEN 커플 연결이 해제되면, THE Couple_System SHALL 사용자에게 데이터 보존 여부를 확인하고, 개인 데이터로 전환한다.
4. THE Dashboard SHALL 파트너의 최근 활동(지출 등록, 체크리스트 완료 등)을 표시한다.

---

### 요구사항 14: 검색 및 필터 일관성

**사용자 스토리:** 사용자로서, 모든 목록 페이지에서 일관된 검색 및 필터 경험을 원한다.

#### 수용 기준

1. THE Checklist_Manager SHALL 체크리스트 항목 검색 기능을 제공한다 (현재 카테고리 필터만 존재).
2. THE Schedule_Manager SHALL 일정 검색 기능을 제공한다 (현재 검색 기능 없음).
3. THE App SHALL 모든 검색 필드에 검색어 초기화(X) 버튼을 제공한다.
4. THE Checklist_Manager SHALL 완료/미완료 필터 토글을 제공한다 (현재 showCompleted 상태는 있으나 UI 토글 미노출).

---

### 요구사항 15: 온보딩 및 초기 사용자 경험

**사용자 스토리:** 사용자로서, 앱을 처음 사용할 때 주요 기능을 쉽게 이해하고 빠르게 설정을 완료하고 싶다.

#### 수용 기준

1. WHEN 사용자가 최초 로그인하면, THE App SHALL 결혼 예정일과 커플 이름을 입력하는 간단한 초기 설정 화면을 표시한다.
2. WHEN 사용자가 예산을 아직 설정하지 않았으면, THE Budget_Manager SHALL 총 예산 설정을 유도하는 안내 배너를 표시한다.
3. WHEN 사용자가 체크리스트가 비어있으면, THE Checklist_Manager SHALL 기본 템플릿 불러오기를 적극적으로 권장한다 (현재 EmptyState에서 제공 중이나 더 눈에 띄게).
4. THE App SHALL 각 주요 기능 페이지에 처음 방문 시 간단한 사용 팁을 표시한다 (FeatureHints 컴포넌트 활용).

