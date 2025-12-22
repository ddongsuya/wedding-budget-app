import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api/stats';
import { queryKeys } from '../../lib/queryClient';

/**
 * 대시보드 통계 요약 조회 훅
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.stats.dashboard(),
    queryFn: async () => {
      const response = await statsAPI.getSummary();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 신선
    gcTime: 30 * 60 * 1000, // 30분 동안 캐시 유지
  });
};

/**
 * 카테고리별 통계 조회 훅
 */
export const useStatsByCategory = () => {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'byCategory'],
    queryFn: async () => {
      const response = await statsAPI.getByCategory();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 월별 통계 조회 훅
 */
export const useStatsByMonth = () => {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'byMonth'],
    queryFn: async () => {
      const response = await statsAPI.getByMonth();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 지불자별 통계 조회 훅
 */
export const useStatsByPayer = () => {
  return useQuery({
    queryKey: [...queryKeys.stats.all, 'byPayer'],
    queryFn: async () => {
      const response = await statsAPI.getByPayer();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};
