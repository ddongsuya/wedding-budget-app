import apiClient from './client';
import { CalendarEvent, EventFormData } from '../types/event';

export const eventAPI = {
  // 전체 조회 (필터 지원)
  getEvents: (params?: {
    start_date?: string;
    end_date?: string;
    category?: string;
    assigned_to?: string;
  }) => apiClient.get<{ success: boolean; data: CalendarEvent[] }>('/events', { params }),

  // 단일 조회
  getEvent: (id: string) =>
    apiClient.get<{ success: boolean; data: CalendarEvent }>(`/events/${id}`),

  // 월별 조회
  getEventsByMonth: (year: number, month: number) =>
    apiClient.get<{ success: boolean; data: CalendarEvent[] }>(`/events/month/${year}/${month}`),

  // 다가오는 일정
  getUpcoming: () =>
    apiClient.get<{ success: boolean; data: CalendarEvent[] }>('/events/upcoming'),

  // 생성
  createEvent: (data: EventFormData) =>
    apiClient.post<{ success: boolean; data: CalendarEvent }>('/events', data),

  // 수정
  updateEvent: (id: string, data: Partial<EventFormData>) =>
    apiClient.put<{ success: boolean; data: CalendarEvent }>(`/events/${id}`, data),

  // 삭제
  deleteEvent: (id: string) =>
    apiClient.delete(`/events/${id}`),
};
