import apiClient from './client';

export type NotificationType =
  | 'dday_milestone'
  | 'dday_daily'
  | 'schedule_reminder'
  | 'checklist_due'
  | 'checklist_overdue'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'couple_activity'
  | 'announcement';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  dday_enabled: boolean;
  dday_daily: boolean;
  schedule_enabled: boolean;
  checklist_enabled: boolean;
  budget_enabled: boolean;
  couple_enabled: boolean;
  announcement_enabled: boolean;
  push_enabled: boolean;
  preferred_time: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const notificationAPI = {
  // 알림 목록 조회
  getNotifications: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{
      success: boolean;
      data: {
        notifications: Notification[];
        pagination: NotificationPagination;
      };
    }>('/notifications', { params }),

  // 안읽은 알림 개수 조회
  getUnreadCount: () =>
    apiClient.get<{
      success: boolean;
      data: { count: number };
    }>('/notifications/unread-count'),

  // 특정 알림 읽음 처리
  markAsRead: (id: string) =>
    apiClient.put<{
      success: boolean;
      data: Notification;
    }>(`/notifications/${id}/read`),

  // 모든 알림 읽음 처리
  markAllAsRead: () =>
    apiClient.put<{
      success: boolean;
      message: string;
    }>('/notifications/read-all'),

  // 특정 알림 삭제
  deleteNotification: (id: string) =>
    apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/notifications/${id}`),

  // 모든 알림 삭제
  clearAll: () =>
    apiClient.delete<{
      success: boolean;
      message: string;
    }>('/notifications'),

  // 알림 설정 조회
  getPreferences: () =>
    apiClient.get<{
      success: boolean;
      data: NotificationPreference;
    }>('/notifications/preferences'),

  // 알림 설정 업데이트
  updatePreferences: (data: Partial<Omit<NotificationPreference, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) =>
    apiClient.put<{
      success: boolean;
      data: NotificationPreference;
    }>('/notifications/preferences', data),
};
