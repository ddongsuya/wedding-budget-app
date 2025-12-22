import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventAPI } from '../../api/events';
import { queryKeys } from '../../lib/queryClient';
import type { CalendarEvent, EventFormData } from '../../types/event';

export interface EventListParams {
  start_date?: string;
  end_date?: string;
  category?: string;
  assigned_to?: string;
}

/**
 * 일정 목록 조회 훅
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const useEventsQuery = (params?: EventListParams) => {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: async () => {
      const response = await eventAPI.getEvents(params);
      return response.data.data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 신선
  });
};

/**
 * 월별 일정 조회 훅
 */
export const useEventsByMonth = (year: number, month: number) => {
  return useQuery({
    queryKey: [...queryKeys.events.all, 'month', year, month],
    queryFn: async () => {
      const response = await eventAPI.getEventsByMonth(year, month);
      return response.data.data as CalendarEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 다가오는 일정 조회 훅
 */
export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: [...queryKeys.events.all, 'upcoming'],
    queryFn: async () => {
      const response = await eventAPI.getUpcoming();
      return response.data.data as CalendarEvent[];
    },
    staleTime: 3 * 60 * 1000, // 3분 동안 신선
  });
};

/**
 * 일정 상세 조회 훅
 */
export const useEventDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: async () => {
      const response = await eventAPI.getEvent(id);
      return response.data.data as CalendarEvent;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * 일정 추가 훅
 */
export const useAddEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: EventFormData) => eventAPI.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 일정 업데이트 훅
 */
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EventFormData> }) => 
      eventAPI.updateEvent(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 일정 삭제 훅
 */
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => eventAPI.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};
