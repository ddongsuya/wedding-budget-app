# 구현 계획: 베타 배포 준비 종합 리뷰

## 개요

Wedding Planner 앱의 베타 배포 전 종합 리뷰에서 도출된 15개 요구사항을 구현한다. DB 마이그레이션 → 백엔드 API → 프론트엔드 유틸리티/훅 → 페이지 강화 → 통합 순서로 진행하며, 모듈 간 데이터 연결성 강화, UX 보완, 기능 확장을 목표로 한다.

## Tasks

- [x] 1. DB 마이그레이션 및 백엔드 기반 구축
  - [x] 1.1 DB 마이그레이션 파일 생성 (016_beta_readiness_updates.sql)
    - venues 테이블에 `exclusion_reason` TEXT 컬럼 추가
    - photo_references 테이블에 `sort_order` INTEGER DEFAULT 0 컬럼 추가
    - notifications 테이블에 `retry_count`, `last_retry_at`, `delivery_status` 컬럼 추가
    - expenses 테이블에 `checklist_item_id` FK 컬럼 추가
    - events 테이블에 `checklist_item_id`, `venue_id` FK 컬럼 추가
    - 관련 인덱스 생성 (idx_expenses_checklist_item, idx_events_checklist_item, idx_events_venue, idx_photo_references_sort, idx_notifications_retry)
    - initDb.ts에 마이그레이션 파일 등록
    - _Requirements: 2.4, 3.2, 6.3, 9.5, 11.3_

  - [x] 1.2 백업 API 구현 (backupController, backup 라우트)
    - `GET /api/backup/export`: 사용자의 전체 데이터(예산, 지출, 체크리스트, 일정, 식장, 사진) JSON 내보내기
    - `POST /api/backup/import`: JSON 데이터 가져오기 (트랜잭션 기반)
    - backend/src/routes/backup.ts 라우트 파일 생성 및 index.ts에 등록
    - _Requirements: 7.2, 7.3_

  - [x] 1.3 계정 삭제 API 구현
    - `DELETE /api/auth/account`: 비밀번호 확인 후 계정 및 관련 데이터 삭제
    - 기존 auth 라우트에 엔드포인트 추가
    - _Requirements: 7.4_

  - [x] 1.4 지출 관련 API 확장
    - `GET /api/expenses/monthly-summary`: 월별 지출 합계 조회 API
    - `GET /api/expenses/export`: 지출 CSV 내보내기 API
    - 기존 expenses 라우트에 엔드포인트 추가
    - _Requirements: 5.1, 5.4_

  - [x] 1.5 포토 레퍼런스 API 확장
    - `PUT /api/photo-references/:id`: 사진 정보 수정 (제목, 메모, 카테고리, 태그)
    - `PATCH /api/photo-references/reorder`: 사진 순서 변경 (sort_order 업데이트)
    - 기존 photoReference 라우트에 엔드포인트 추가
    - _Requirements: 11.1, 11.3_

  - [x] 1.6 커플 동기화 API 구현
    - `GET /api/couple/last-activity`: 파트너 최근 활동 조회 (마지막 변경 타임스탬프)
    - 기존 couple 라우트에 엔드포인트 추가
    - _Requirements: 13.1, 13.4_

  - [x] 1.7 백엔드 API 단위 테스트 작성
    - backup export/import API 테스트
    - 계정 삭제 API 테스트
    - 월별 지출 요약 API 테스트
    - 사진 수정/순서 변경 API 테스트
    - _Requirements: 1.2, 5.1, 7.2, 7.3, 7.4, 11.1, 11.3_

- [x] 2. 알림 시스템 강화 (백엔드)
  - [x] 2.1 알림 트리거 서비스 확장
    - backend/src/services/notificationTriggers.ts 생성
    - 체크리스트 마감 시기 도래 알림 트리거 구현
    - 결제 예정 지출 알림 트리거 구현 (due_date 3일 이내)
    - 커플 파트너 활동 알림 트리거 구현
    - 기존 notificationService.ts에 트리거 호출 연동
    - _Requirements: 9.1, 9.2, 9.3, 5.3_

  - [x] 2.2 알림 실패 재시도 로직 구현
    - backend/src/services/notificationRetry.ts 생성
    - 실패 시 retry_count 증가, delivery_status 'failed' 설정
    - 다음 주기에 재시도 (최대 3회)
    - _Requirements: 9.5_

  - [x] 2.3 알림 딥링크 데이터 추가
    - 알림 생성 시 link 필드에 대상 경로 포함 (예: `/expenses?id=123`)
    - 기존 알림 생성 함수에 link 파라미터 추가
    - _Requirements: 9.4_

  - [x] 2.4 알림 트리거 속성 기반 테스트 작성
    - **Property 11: 결제 예정 알림 트리거** - status='planned'이고 due_date 3일 이내인 지출에 대해 알림 생성 검증
    - **Validates: Requirements 5.3, 9.2**
  
  - [x] 2.5 체크리스트 마감 알림 속성 기반 테스트 작성
    - **Property 20: 체크리스트 마감 알림 트리거** - due_period가 현재 D-day와 일치하는 미완료 항목에 대해 알림 생성 검증
    - **Validates: Requirements 9.1**

  - [x] 2.6 알림 재시도 속성 기반 테스트 작성
    - **Property 23: 알림 실패 재시도** - 실패 알림의 retry_count 증가, 최대 3회 초과 시 중단 검증
    - **Validates: Requirements 9.5**

- [x] 3. 체크포인트 - 백엔드 구현 확인
  - 모든 테스트 통과 확인, 질문이 있으면 사용자에게 문의

- [x] 4. 프론트엔드 유틸리티 및 공통 훅 구현
  - [x] 4.1 모듈 간 네비게이션 유틸리티 생성
    - src/utils/crossLink.ts 생성
    - CrossLinkParams 인터페이스 정의 (target, filter, highlight, action)
    - navigateCrossLink 함수 구현 (useNavigate + useSearchParams 패턴)
    - _Requirements: 1.1, 1.3, 2.2, 2.4, 3.1, 4.1, 4.2, 4.4_

  - [x] 4.2 CSV/JSON 내보내기 유틸리티 생성
    - src/utils/exportData.ts 생성
    - exportToCSV 함수 구현 (Blob 다운로드)
    - exportToJSON 함수 구현
    - _Requirements: 5.4_

  - [x] 4.3 CSV 내보내기 라운드 트립 속성 기반 테스트 작성
    - **Property 12: 지출 CSV 내보내기 라운드 트립** - CSV 내보내기 후 파싱하면 원본 데이터와 동일한 데이터 복원 검증
    - **Validates: Requirements 5.4**

  - [x] 4.4 폼 임시 저장 훅 생성
    - src/hooks/useFormDraft.ts 생성
    - localStorage 기반 draft/setDraft/clearDraft/hasDraft 구현
    - _Requirements: 6.5, 12.5_

  - [x] 4.5 폼 임시 저장 라운드 트립 속성 기반 테스트 작성
    - **Property 16: 폼 임시 저장 라운드 트립** - localStorage 저장 후 복원 시 원본 데이터와 동일 검증
    - **Validates: Requirements 6.5, 12.5**

  - [x] 4.6 폼 유효성 검사 훅 생성
    - src/hooks/useFormValidation.ts 생성
    - ValidationRule 인터페이스 (required, minLength, min, pattern, message)
    - 필드별 에러 상태 관리 및 인라인 에러 메시지 반환
    - _Requirements: 12.1, 12.4_

  - [x] 4.7 필수 필드 유효성 검사 속성 기반 테스트 작성
    - **Property 29: 필수 필드 유효성 검사** - 필수 필드 비어있을 때 에러 메시지 표시 및 제출 차단 검증
    - **Validates: Requirements 12.1, 12.4**

  - [x] 4.8 모바일 키보드 회피 훅 생성
    - src/hooks/useKeyboardAvoid.ts 생성
    - visualViewport API 활용하여 모달 내 input focus 시 스크롤 위치 자동 조정
    - _Requirements: 10.1_

  - [x] 4.9 무한 스크롤 훅 생성
    - src/hooks/useInfiniteScroll.ts 생성
    - IntersectionObserver 기반 구현
    - 기존 API의 page/limit 파라미터 활용
    - _Requirements: 10.2_

  - [x] 4.10 커플 동기화 훅 생성
    - src/hooks/useCoupleSync.ts 생성
    - 30초 간격 폴링으로 파트너 변경 감지
    - 변경 감지 시 React Query invalidateQueries 호출
    - _Requirements: 13.1_

  - [x] 4.11 백업 API 클라이언트 생성
    - src/api/backup.ts 생성
    - exportData, importData 함수 구현
    - _Requirements: 7.2, 7.3_

  - [x] 4.12 백업 라운드 트립 속성 기반 테스트 작성
    - **Property 18: 데이터 백업/복원 라운드 트립** - JSON 내보내기 후 가져오기 시 원본 데이터와 동일 검증
    - **Validates: Requirements 7.2, 7.3**

- [x] 5. 다크 모드 및 테마 시스템 구현
  - [x] 5.1 ThemeContext 및 다크 모드 구현
    - src/contexts/ThemeContext.tsx 생성
    - tailwind.config.js에 darkMode: 'class' 설정
    - document.documentElement.classList.toggle('dark') 로직
    - localStorage에 테마 설정 저장/복원
    - App.tsx에 ThemeProvider 래핑
    - _Requirements: 7.5_

  - [x] 5.2 다크 모드 토글 속성 기반 테스트 작성
    - **Property 19: 다크 모드 토글** - 활성화 시 'dark' 클래스 추가, 비활성화 시 제거 검증
    - **Validates: Requirements 7.5**

- [x] 6. 체크포인트 - 프론트엔드 기반 모듈 확인
  - 모든 테스트 통과 확인, 질문이 있으면 사용자에게 문의

- [x] 7. 예산-지출 연결성 및 지출 관리 강화
  - [x] 7.1 카테고리 예산 진행률 컴포넌트 생성
    - src/components/expense/CategoryBudgetProgress.tsx 생성
    - 카테고리명, 예산 금액, 지출 금액, 진행률 바 표시
    - _Requirements: 1.4_

  - [x] 7.2 Budget 페이지에서 카테고리 클릭 시 지출 페이지 이동 구현
    - Budget.tsx에서 카테고리 클릭 시 navigate('/expenses?category_id=${id}') 호출
    - _Requirements: 1.1_

  - [x] 7.3 Expenses 페이지에 카테고리 필터 및 진행률 바 연동
    - URL 파라미터에서 category_id 읽어 자동 필터 적용
    - 필터링된 카테고리의 CategoryBudgetProgress 컴포넌트 표시
    - _Requirements: 1.1, 1.4_

  - [x] 7.4 카테고리 필터링 정확성 속성 기반 테스트 작성
    - **Property 1: 카테고리 필터링 정확성** - 카테고리 ID로 필터링된 지출 목록이 해당 카테고리만 포함하는지 검증
    - **Validates: Requirements 1.1, 1.4**

  - [x] 7.5 예산-지출 합계 일관성 속성 기반 테스트 작성
    - **Property 2: 예산-지출 합계 일관성** - 카테고리 지출 합계가 실제 지출 amount 합과 동일한지 검증
    - **Validates: Requirements 1.2**

  - [x] 7.6 월별 지출 차트 컴포넌트 생성
    - src/components/expense/MonthlyExpenseChart.tsx 생성
    - 순수 SVG 바 차트 또는 recharts 활용
    - 최근 6개월 월별 지출 합계 표시
    - _Requirements: 5.1_

  - [x] 7.7 월별 지출 집계 정확성 속성 기반 테스트 작성
    - **Property 9: 월별 지출 집계 정확성** - 월별 차트 합계가 해당 월 지출 amount 합과 동일한지 검증
    - **Validates: Requirements 5.1**

  - [x] 7.8 지출 상태별 탭 분리 구현
    - Expenses.tsx에 'all' | 'completed' | 'planned' 탭 UI 추가
    - 기존 filteredExpenses에 status 필터 추가
    - _Requirements: 5.2_

  - [x] 7.9 지출 상태별 탭 필터링 속성 기반 테스트 작성
    - **Property 10: 지출 상태별 탭 필터링** - 각 탭에 해당 status 지출만 표시되는지 검증
    - **Validates: Requirements 5.2**

  - [x] 7.10 결제 상태 변경 시 결제일 자동 설정 구현
    - "결제 예정" → "결제 완료" 변경 시 ConfirmDialog로 결제일 현재 날짜 자동 설정 확인
    - _Requirements: 5.5_

  - [x] 7.11 지출 CSV 내보내기 UI 연동
    - Expenses.tsx에 내보내기 버튼 추가
    - exportToCSV 유틸리티 호출
    - _Requirements: 5.4_

  - [x] 7.12 Dashboard에서 예산 초과 카테고리 딥링크 추가
    - 초과 카테고리 알림에서 해당 카테고리 지출 내역으로 직접 이동 링크 추가
    - KPI 카드 클릭 시 해당 상세 페이지로 이동 핸들러 추가
    - _Requirements: 1.3, 1.5, 4.4_

  - [x] 7.13 예산 초과 감지 정확성 속성 기반 테스트 작성
    - **Property 3: 예산 초과 감지 정확성** - spentAmount > budgetAmount이고 budgetAmount > 0인 카테고리만 초과로 표시되는지 검증
    - **Validates: Requirements 1.5**

- [x] 8. 예식장-지출-일정 연결성 및 UX 보완
  - [x] 8.1 예식장 계약 확정 시 지출/일정 자동 등록 제안 구현
    - VenueExpenseSync 컴포넌트 생성 (src/components/venue/VenueExpenseSync.tsx)
    - 계약 확정 시 ConfirmDialog로 지출 자동 등록 제안
    - 방문 예정 식장에 일정 추가 제안 다이얼로그
    - _Requirements: 2.1, 2.2_

  - [x] 8.2 식장 상세에 관련 지출/일정 섹션 추가
    - SelectedVenueDetail.tsx에 관련 지출 내역과 일정 표시 섹션 추가
    - _Requirements: 2.3, 2.4_

  - [x] 8.3 예식장 계약 비용 일관성 속성 기반 테스트 작성
    - **Property 4: 예식장 계약 비용 일관성** - 계약 식장 총 비용이 연관 지출 합계와 일치하는지 검증
    - **Validates: Requirements 2.3**

  - [x] 8.4 식장 카드 인디케이터 추가
    - VenueCardDeck.tsx에 "현재/전체" (예: 2/5) 인디케이터 UI 추가
    - _Requirements: 6.1_

  - [x] 8.5 식장 카드 인디케이터 정확성 속성 기반 테스트 작성
    - **Property 13: 식장 카드 인디케이터 정확성** - "i/N" 형식 표시 및 1 ≤ i ≤ N 검증
    - **Validates: Requirements 6.1**

  - [x] 8.6 식장 비교 최저가/최고가 하이라이트 구현
    - VenueCompare.tsx에 항목별 최저가/최고가 하이라이트 로직 추가
    - _Requirements: 6.2_

  - [x] 8.7 식장 비교 최저가/최고가 정확성 속성 기반 테스트 작성
    - **Property 14: 식장 비교 최저가/최고가 정확성** - 하이라이트된 값이 실제 최솟값/최댓값인지 검증
    - **Validates: Requirements 6.2**

  - [x] 8.8 식장 제외 사유 입력 및 방문일 정렬 구현
    - "제외됨" 상태 변경 시 exclusion_reason 입력 필드 표시
    - 식장 목록에 방문일 기준 정렬 옵션 추가
    - _Requirements: 6.3, 6.4_

  - [x] 8.9 방문일 기준 정렬 정확성 속성 기반 테스트 작성
    - **Property 15: 방문일 기준 정렬 정확성** - 방문일 기준 정렬 시 올바른 순서 검증
    - **Validates: Requirements 6.4**

  - [x] 8.10 계약 폼 임시 저장 연동
    - VenueContractForm.tsx에 useFormDraft 훅 적용
    - 앱 이탈 시 임시 저장, 복귀 시 복원 여부 확인
    - _Requirements: 6.5_

- [x] 9. 체크리스트-일정-지출 연결성 구현
  - [x] 9.1 체크리스트 완료 시 바로가기 버튼 구현
    - ChecklistActionLinks 컴포넌트 생성 (src/components/checklist/ChecklistActionLinks.tsx)
    - 체크리스트 완료 시 "관련 지출 등록" / "관련 일정 추가" 바로가기 표시
    - Checklist.tsx에 연동
    - _Requirements: 3.1_

  - [x] 9.2 체크리스트 항목에 연관 데이터 요약 뱃지 추가
    - 각 항목에 연관 일정 개수, 지출 금액 요약 뱃지 표시
    - _Requirements: 3.2_

  - [x] 9.3 체크리스트 연관 데이터 집계 정확성 속성 기반 테스트 작성
    - **Property 5: 체크리스트 연관 데이터 집계 정확성** - 연관 일정 개수와 지출 금액이 실제 데이터와 일치하는지 검증
    - **Validates: Requirements 3.2**

  - [x] 9.4 일정 추가 시 체크리스트 항목 연결 옵션 추가
    - Schedule 페이지의 EventModal에 체크리스트 항목 선택 드롭다운 추가
    - _Requirements: 3.3_

- [x] 10. 대시보드 정보 완성도 향상
  - [x] 10.1 대시보드에 다가오는 일정/결제 예정/마감 임박 체크리스트 위젯 추가
    - Dashboard.tsx에 다가오는 일정 목록 (최대 3개, 날짜 오름차순) 표시
    - 결제 예정 지출 (status=planned) 목록 표시
    - 마감 임박 체크리스트 항목 표시
    - 각 항목 클릭 시 해당 페이지로 이동
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 10.2 대시보드 다가오는 일정 제한 속성 기반 테스트 작성
    - **Property 6: 대시보드 다가오는 일정 제한** - 최대 3개, 날짜 오름차순 정렬 검증
    - **Validates: Requirements 4.1**

  - [x] 10.3 대시보드 결제 예정 필터링 속성 기반 테스트 작성
    - **Property 7: 대시보드 결제 예정 필터링** - status='planned'인 지출만 표시되는지 검증
    - **Validates: Requirements 4.2**

  - [x] 10.4 대시보드 마감 임박 체크리스트 정확성 속성 기반 테스트 작성
    - **Property 8: 대시보드 마감 임박 체크리스트 정확성** - 미완료이고 D-day에 가장 가까운 항목 표시 검증
    - **Validates: Requirements 4.3**

  - [x] 10.5 대시보드에 예식장 확정 여부 위젯 및 파트너 활동 표시 추가
    - 예식장 확정 여부 표시, 미확정 시 Venue_Manager 바로가기
    - 파트너 최근 활동 섹션 추가 (useCoupleSync 훅 활용)
    - _Requirements: 4.5, 13.4_

  - [x] 10.6 커플 파트너 활동 알림 속성 기반 테스트 작성
    - **Property 21: 커플 파트너 활동 알림** - 파트너 데이터 변경 시 상대방에게 활동 알림 생성 검증
    - **Validates: Requirements 9.3**

- [x] 11. 체크포인트 - 모듈 간 연결성 및 대시보드 확인
  - 모든 테스트 통과 확인, 질문이 있으면 사용자에게 문의

- [x] 12. 설정 및 프로필 기능 보완
  - [x] 12.1 결혼 예정일 변경 전파 구현
    - Settings.tsx에서 결혼 예정일 변경 시 CustomEvent 발생
    - Dashboard, Checklist, Notification 컴포넌트에서 이벤트 리스닝 및 데이터 갱신
    - _Requirements: 7.1_

  - [x] 12.2 결혼 예정일 변경 전파 속성 기반 테스트 작성
    - **Property 17: 결혼 예정일 변경 전파** - 변경 후 D-day 계산, 시기 계산이 새 날짜 기준으로 갱신되는지 검증
    - **Validates: Requirements 7.1**

  - [x] 12.3 데이터 백업/복원 UI 구현
    - Settings.tsx에 데이터 백업(내보내기) 버튼 추가 → backupAPI.exportData 호출
    - 데이터 복원(가져오기) 버튼 추가 → 파일 선택 → backupAPI.importData 호출
    - _Requirements: 7.2, 7.3_

  - [x] 12.4 계정 삭제(회원 탈퇴) UI 구현
    - Settings.tsx에 계정 삭제 버튼 추가
    - 1단계: ConfirmDialog "정말 탈퇴하시겠습니까?"
    - 2단계: 비밀번호 재입력 확인 모달
    - DELETE /api/auth/account 호출
    - _Requirements: 7.4_

  - [x] 12.5 다크 모드 토글 UI 연동
    - Settings.tsx에서 "준비중" 상태를 실제 다크 모드 토글로 교체
    - ThemeContext의 toggleTheme 호출
    - _Requirements: 7.5_

- [x] 13. 네비게이션 및 페이지 접근성 개선
  - [x] 13.1 Layout 미적용 페이지에 Layout 래핑 추가
    - App.tsx에서 /notifications, /notifications/settings, /couple/connect, /announcements, /settings/password 라우트에 Layout 컴포넌트 래핑
    - _Requirements: 8.1_

  - [x] 13.2 FAB 메뉴에 체크리스트 추가 옵션 추가
    - Layout.tsx의 FAB 메뉴에 "체크리스트 추가" 옵션 추가
    - _Requirements: 8.4_

  - [x] 13.3 페이지 전환 애니메이션 구현
    - src/components/common/PageTransition.tsx 생성
    - framer-motion의 AnimatePresence + motion.div 래퍼
    - App.tsx의 라우트에 PageTransition 적용
    - _Requirements: 8.5_

- [x] 14. 모바일 UX 세부 보완
  - [x] 14.1 ConfirmDialog 통일 적용
    - Budget.tsx, Expenses.tsx, Checklist.tsx, PhotoReferences.tsx에서 window.confirm() 호출을 ConfirmDialog 컴포넌트로 교체
    - _Requirements: 10.3_

  - [x] 14.2 커스텀 DatePicker 통일 적용
    - Schedule 페이지의 EventModal에서 네이티브 input[type=date]를 커스텀 DatePicker 컴포넌트로 교체
    - _Requirements: 10.4_

  - [x] 14.3 모달에 키보드 회피 훅 적용
    - 지출 폼, 일정 폼, 체크리스트 폼, 계약 폼 모달에 useKeyboardAvoid 훅 적용
    - _Requirements: 10.1_

  - [x] 14.4 긴 목록에 무한 스크롤/페이지네이션 적용
    - Expenses, Checklist, Schedule 페이지에 useInfiniteScroll 훅 적용
    - _Requirements: 10.2_

  - [x] 14.5 페이지네이션 데이터 제한 속성 기반 테스트 작성
    - **Property 24: 페이지네이션 데이터 제한** - 반환 항목 수가 limit 이하이고 올바른 offset 적용 검증
    - **Validates: Requirements 10.2**

- [x] 15. 포토 레퍼런스 기능 확장
  - [x] 15.1 사진 수정 모달 구현
    - src/components/photo/PhotoEditModal.tsx 생성
    - 제목, 메모, 카테고리, 태그 수정 폼
    - PUT /api/photo-references/:id API 호출
    - PhotoReferences.tsx에 수정 버튼 및 모달 연동
    - _Requirements: 11.1_

  - [x] 15.2 사진 수정 라운드 트립 속성 기반 테스트 작성
    - **Property 25: 사진 수정 라운드 트립** - 수정 후 조회 시 수정된 값 반영 검증
    - **Validates: Requirements 11.1**

  - [x] 15.3 URL 이미지 추가 기능 구현
    - 업로드 모달에 "URL로 추가" 탭 추가
    - URL 입력 → 미리보기 → 저장 플로우
    - _Requirements: 11.2_

  - [x] 15.4 드래그 앤 드롭 순서 변경 구현
    - @dnd-kit/core 라이브러리 활용
    - PATCH /api/photo-references/reorder API 호출
    - _Requirements: 11.3_

  - [x] 15.5 사진 순서 변경 보존 속성 기반 테스트 작성
    - **Property 26: 사진 순서 변경 보존** - 순서 변경 후 조회 시 변경된 순서 유지 검증
    - **Validates: Requirements 11.3**

  - [x] 15.6 카테고리별 사진 개수 표시 및 좌우 스와이프 탐색 구현
    - 필터 버튼 옆에 카테고리별 개수 뱃지 표시
    - 상세 모달에서 터치 스와이프/화살표로 이전/다음 사진 이동
    - _Requirements: 11.4, 11.5_

  - [x] 15.7 카테고리별 사진 개수 정확성 속성 기반 테스트 작성
    - **Property 27: 카테고리별 사진 개수 정확성** - 표시 개수가 실제 해당 카테고리 사진 수와 일치하는지 검증
    - **Validates: Requirements 11.4**

  - [x] 15.8 사진 갤러리 네비게이션 속성 기반 테스트 작성
    - **Property 28: 사진 갤러리 네비게이션** - 다음/이전 이동 시 올바른 사진 표시 및 경계값 처리 검증
    - **Validates: Requirements 11.5**

- [x] 16. 체크포인트 - 포토/모바일 UX/설정 기능 확인
  - 모든 테스트 통과 확인, 질문이 있으면 사용자에게 문의

- [x] 17. 데이터 유효성 및 에러 처리 강화
  - [x] 17.1 인라인 에러 메시지 적용
    - ExpenseForm, VenueContractForm, 체크리스트 폼, 일정 폼에 useFormValidation 훅 적용
    - alert() 대신 필드 하단 빨간 텍스트 에러 메시지 표시
    - _Requirements: 12.1_

  - [x] 17.2 금액 입력 필드 음수 방지 적용
    - ExpenseForm, BudgetSettingModal 등의 금액 입력 필드에 min={0} 및 onInput 핸들러로 음수 차단
    - _Requirements: 12.4_

  - [x] 17.3 API 에러 메시지 통일 및 토큰 자동 갱신 구현
    - 각 페이지 catch 블록에서 toast.error(error.response?.data?.message || '기본 메시지') 패턴 통일
    - src/api/client.ts 인터셉터에 401 응답 시 refresh token 자동 갱신 로직 추가
    - 갱신 실패 시 로그인 페이지 리다이렉트 + 안내 메시지
    - _Requirements: 12.2, 12.3_

  - [x] 17.4 API 에러 메시지 매핑 속성 기반 테스트 작성
    - **Property 30: API 에러 메시지 매핑** - HTTP 에러 상태 코드별 한국어 메시지 매핑 검증
    - **Validates: Requirements 12.2**

  - [x] 17.5 토큰 갱신 흐름 속성 기반 테스트 작성
    - **Property 31: 토큰 갱신 흐름** - 401 응답 시 자동 갱신 및 재시도, 갱신 실패 시 리다이렉트 검증
    - **Validates: Requirements 12.3**

- [x] 18. 커플 동기화 및 검색/필터 구현
  - [x] 18.1 커플 동기화 UI 연동
    - Dashboard.tsx에 useCoupleSync 훅 적용
    - Settings.tsx에 커플 연결 상태 뱃지 추가 ("연결됨: 파트너이름" / "미연결")
    - 연결 해제 시 ConfirmDialog로 데이터 보존 여부 확인
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 18.2 커플 데이터 동기화 속성 기반 테스트 작성
    - **Property 32: 커플 데이터 동기화** - 파트너 데이터 변경 시 폴링 주기 내 반영 검증
    - **Validates: Requirements 13.1**

  - [x] 18.3 체크리스트 검색 및 완료/미완료 필터 구현
    - Checklist.tsx에 검색 입력 필드 추가 (클라이언트 사이드 필터링)
    - 완료/미완료 토글 UI 추가 (기존 showCompleted 상태 활용)
    - 검색어 초기화(X) 버튼 추가
    - _Requirements: 14.1, 14.3, 14.4_

  - [x] 18.4 일정 검색 기능 구현
    - Schedule.tsx에 검색 입력 필드 추가
    - 이벤트 제목/카테고리 기준 필터링
    - 검색어 초기화(X) 버튼 추가
    - _Requirements: 14.2, 14.3_

  - [x] 18.5 검색 필터링 정확성 속성 기반 테스트 작성
    - **Property 33: 검색 필터링 정확성** - 검색 결과가 제목에 쿼리를 포함하는 항목만 반환하는지 검증
    - **Validates: Requirements 14.1, 14.2**

  - [x] 18.6 검색어 초기화 속성 기반 테스트 작성
    - **Property 34: 검색어 초기화** - 비어있지 않은 검색 쿼리에 X 버튼 표시, 클릭 시 초기화 검증
    - **Validates: Requirements 14.3**

  - [x] 18.7 완료/미완료 필터 토글 속성 기반 테스트 작성
    - **Property 35: 완료/미완료 필터 토글** - 미완료 필터 시 is_completed=false 항목만 표시 검증
    - **Validates: Requirements 14.4**

- [x] 19. 온보딩 및 초기 사용자 경험 개선
  - [x] 19.1 초기 설정 화면 강화
    - 기존 SetupWizard 컴포넌트에 결혼 예정일 + 커플 이름 입력 단계 추가
    - 완료 시 coupleAPI.updateProfile 호출
    - _Requirements: 15.1_

  - [x] 19.2 예산 미설정 안내 배너 구현
    - Budget.tsx에 totalBudget === 0일 때 안내 배너 표시
    - "총 예산을 설정하면 카테고리별 예산 관리가 가능합니다" 메시지
    - _Requirements: 15.2_

  - [x] 19.3 예산 미설정 안내 배너 속성 기반 테스트 작성
    - **Property 36: 예산 미설정 안내 배너** - totalBudget=0이면 배너 표시, 0보다 크면 미표시 검증
    - **Validates: Requirements 15.2**

  - [x] 19.4 기능 페이지 사용 팁 구현
    - 기존 FeatureHints 컴포넌트 활용
    - 각 주요 페이지 첫 방문 시 localStorage 기반 팁 표시
    - _Requirements: 15.4_

  - [x] 19.5 기능 팁 첫 방문 표시 속성 기반 테스트 작성
    - **Property 37: 기능 팁 첫 방문 표시** - 첫 방문 시 팁 표시, 이후 방문 시 미표시 검증
    - **Validates: Requirements 15.4**

- [x] 20. 알림 딥링크 및 프론트엔드 알림 연동
  - [x] 20.1 알림 클릭 시 딥링크 네비게이션 구현
    - NotificationCenter.tsx에서 알림 클릭 시 notification.link 경로로 navigate 호출
    - _Requirements: 9.4_

  - [x] 20.2 알림 딥링크 정확성 속성 기반 테스트 작성
    - **Property 22: 알림 딥링크 정확성** - link 필드가 있는 알림 클릭 시 해당 경로로 네비게이션 검증
    - **Validates: Requirements 9.4**

- [x] 21. 최종 체크포인트 - 전체 통합 확인
  - 모든 테스트 통과 확인, 질문이 있으면 사용자에게 문의
  - 모든 요구사항(1~15) 커버리지 확인
  - 모듈 간 연결성 동작 확인

## Notes

- `*` 표시된 태스크는 선택 사항이며 빠른 MVP를 위해 건너뛸 수 있습니다
- 각 태스크는 추적 가능성을 위해 특정 요구사항을 참조합니다
- 체크포인트는 점진적 검증을 보장합니다
- 속성 기반 테스트는 보편적 정확성 속성을 검증합니다
- 단위 테스트는 특정 예시와 엣지 케이스를 검증합니다
