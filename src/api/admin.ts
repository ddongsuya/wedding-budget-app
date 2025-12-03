import apiClient from './client';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  totalCouples: number;
  connectedCouples: number;
  weeklyStats: Array<{
    date: string;
    count: number;
  }>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  couple_id: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  invite_code?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'new' | 'update' | 'notice' | 'maintenance';
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const adminAPI = {
  // 대시보드 통계
  getDashboardStats: () =>
    apiClient.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard/stats'),

  // 사용자 관리
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{
      success: boolean;
      data: {
        users: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }>('/admin/users', { params }),

  toggleUserAdmin: (userId: number, isAdmin: boolean) =>
    apiClient.put<{ success: boolean; message: string }>(`/admin/users/${userId}/admin`, {
      isAdmin,
    }),

  // 공지사항 관리
  getAnnouncements: (params?: { page?: number; limit?: number; type?: string; active?: boolean }) =>
    apiClient.get<{ success: boolean; data: Announcement[] }>('/admin/announcements', { params }),

  createAnnouncement: (data: {
    title: string;
    content: string;
    type?: string;
    priority?: number;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.post<{ success: boolean; data: Announcement; message: string }>(
      '/admin/announcements',
      data
    ),

  updateAnnouncement: (
    id: number,
    data: {
      title?: string;
      content?: string;
      type?: string;
      priority?: number;
      isActive?: boolean;
      startDate?: string;
      endDate?: string;
    }
  ) =>
    apiClient.put<{ success: boolean; data: Announcement; message: string }>(
      `/admin/announcements/${id}`,
      data
    ),

  deleteAnnouncement: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/admin/announcements/${id}`),

  // 활성 공지사항 조회 (일반 사용자용)
  getActiveAnnouncements: () =>
    apiClient.get<{ success: boolean; data: Announcement[] }>('/admin/announcements/active'),
};
