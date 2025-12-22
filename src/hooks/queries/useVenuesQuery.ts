import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { venueAPI, VenueCreateInput, VenueUpdateInput, VenueListParams } from '../../api/venues';
import { queryKeys } from '../../lib/queryClient';
import type { Venue } from '../../../types';

/**
 * 식장 목록 조회 훅
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const useVenuesQuery = (params?: VenueListParams) => {
  return useQuery({
    queryKey: queryKeys.venues.list(params),
    queryFn: async () => {
      const response = await venueAPI.getList(params);
      return {
        venues: response.data.venues as Venue[],
        pagination: response.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 신선
  });
};

/**
 * 식장 상세 조회 훅
 */
export const useVenueDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.venues.detail(id),
    queryFn: async () => {
      const response = await venueAPI.getById(id);
      return response.data.venue as Venue;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10분 동안 신선
  });
};

/**
 * 식장 추가 훅
 */
export const useAddVenue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: VenueCreateInput) => venueAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 식장 업데이트 훅
 */
export const useUpdateVenue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VenueUpdateInput }) => 
      venueAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 식장 삭제 훅
 */
export const useDeleteVenue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => venueAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.venues.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};
