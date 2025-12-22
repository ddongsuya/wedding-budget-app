/**
 * React Query 기반 데이터 페칭 훅
 * 
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 * 
 * 각 훅은 다음 기능을 제공합니다:
 * - 자동 캐싱 및 재검증
 * - 로딩/에러 상태 관리
 * - 낙관적 업데이트
 * - 자동 재시도
 */

// 예산 관련 훅
export {
  useBudgetSettings,
  useUpdateBudgetSettings,
  useBudgetCategories,
  useAddBudgetCategory,
  useUpdateBudgetCategory,
  useDeleteBudgetCategory,
} from './useBudgetQuery';

// 식장 관련 훅
export {
  useVenuesQuery,
  useVenueDetail,
  useAddVenue,
  useUpdateVenue,
  useDeleteVenue,
} from './useVenuesQuery';

// 지출 관련 훅
export {
  useExpensesQuery,
  useExpenseDetail,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
  useUploadReceipt,
} from './useExpensesQuery';

// 일정 관련 훅
export {
  useEventsQuery,
  useEventsByMonth,
  useUpcomingEvents,
  useEventDetail,
  useAddEvent,
  useUpdateEvent,
  useDeleteEvent,
} from './useEventsQuery';

// 통계 관련 훅
export { 
  useDashboardStats,
  useStatsByCategory,
  useStatsByMonth,
  useStatsByPayer,
} from './useStatsQuery';

// 쿼리 키 및 유틸리티
export { queryKeys, invalidateQueries, queryClient } from '../../lib/queryClient';
