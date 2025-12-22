import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 클라이언트 설정
 * 
 * staleTime: 데이터가 "신선"하다고 간주되는 시간 (이 시간 동안 재요청 안함)
 * gcTime: 캐시에서 데이터가 유지되는 시간 (이전 cacheTime)
 * 
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분 동안 데이터를 신선하다고 간주 (재요청 안함)
      staleTime: 5 * 60 * 1000,
      
      // 30분 동안 캐시 유지 (가비지 컬렉션 전)
      gcTime: 30 * 60 * 1000,
      
      // 창 포커스 시 자동 재요청 비활성화 (불필요한 요청 방지)
      refetchOnWindowFocus: false,
      
      // 마운트 시 자동 재요청 비활성화 (stale 데이터만 재요청)
      refetchOnMount: false,
      
      // 재연결 시 자동 재요청
      refetchOnReconnect: true,
      
      // 실패 시 3번까지 재시도
      retry: 3,
      
      // 재시도 간격 (지수 백오프)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // 뮤테이션 실패 시 1번 재시도
      retry: 1,
    },
  },
});

/**
 * 쿼리 키 상수
 * 일관된 캐시 키 관리를 위한 상수 정의
 */
export const queryKeys = {
  // 예산 관련
  budget: {
    all: ['budget'] as const,
    settings: () => [...queryKeys.budget.all, 'settings'] as const,
    categories: () => [...queryKeys.budget.all, 'categories'] as const,
  },
  
  // 지출 관련
  expenses: {
    all: ['expenses'] as const,
    list: <T extends object = Record<string, unknown>>(params?: T) => [...queryKeys.expenses.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.expenses.all, 'detail', id] as const,
  },
  
  // 식장 관련
  venues: {
    all: ['venues'] as const,
    list: <T extends object = Record<string, unknown>>(params?: T) => [...queryKeys.venues.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.venues.all, 'detail', id] as const,
  },
  
  // 일정 관련
  events: {
    all: ['events'] as const,
    list: <T extends object = Record<string, unknown>>(params?: T) => [...queryKeys.events.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
  },
  
  // 체크리스트 관련
  checklist: {
    all: ['checklist'] as const,
    items: (params?: Record<string, unknown>) => [...queryKeys.checklist.all, 'items', params] as const,
    categories: () => [...queryKeys.checklist.all, 'categories'] as const,
  },
  
  // 통계 관련
  stats: {
    all: ['stats'] as const,
    dashboard: () => [...queryKeys.stats.all, 'dashboard'] as const,
  },
  
  // 커플 프로필
  couple: {
    all: ['couple'] as const,
    profile: () => [...queryKeys.couple.all, 'profile'] as const,
  },
  
  // 알림 관련
  notifications: {
    all: ['notifications'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.notifications.all, 'list', params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
  
  // 사진 참고자료
  photoReferences: {
    all: ['photoReferences'] as const,
    list: (params?: Record<string, unknown>) => [...queryKeys.photoReferences.all, 'list', params] as const,
  },
  
  // 공지사항
  announcements: {
    all: ['announcements'] as const,
    list: () => [...queryKeys.announcements.all, 'list'] as const,
  },
};

/**
 * 캐시 무효화 유틸리티
 */
export const invalidateQueries = {
  budget: () => queryClient.invalidateQueries({ queryKey: queryKeys.budget.all }),
  expenses: () => queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all }),
  venues: () => queryClient.invalidateQueries({ queryKey: queryKeys.venues.all }),
  events: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  checklist: () => queryClient.invalidateQueries({ queryKey: queryKeys.checklist.all }),
  stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.stats.all }),
  couple: () => queryClient.invalidateQueries({ queryKey: queryKeys.couple.all }),
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  photoReferences: () => queryClient.invalidateQueries({ queryKey: queryKeys.photoReferences.all }),
  announcements: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all }),
  all: () => queryClient.invalidateQueries(),
};
