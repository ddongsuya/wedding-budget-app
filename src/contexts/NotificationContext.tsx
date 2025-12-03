import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { notificationAPI, Notification, NotificationPreference } from '../api/notifications';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference | null;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<NotificationPreference>) => Promise<void>;
  hasMore: boolean;
  currentPage: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);


  // 알림 목록 조회
  const fetchNotifications = useCallback(async (page: number = 1) => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationAPI.getNotifications({ page, limit: 20 });
      
      if (response.data.success) {
        const { notifications: newNotifications, pagination } = response.data.data;
        
        if (page === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        
        setCurrentPage(pagination.page);
        setTotalPages(pagination.totalPages);
        setHasMore(pagination.page < pagination.totalPages);
      }
    } catch (err) {
      setError('알림을 불러오는데 실패했습니다');
      console.error('Fetch notifications error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 안읽은 알림 개수 조회
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data.count);
      }
    } catch (err) {
      console.error('Fetch unread count error:', err);
    }
  }, [isAuthenticated]);

  // 알림 읽음 처리
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await notificationAPI.markAsRead(id);
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, []);

  // 모든 알림 읽음 처리
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationAPI.markAllAsRead();
      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, []);

  // 알림 삭제
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      const response = await notificationAPI.deleteNotification(id);
      if (response.data.success) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notification && !notification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Delete notification error:', err);
    }
  }, [notifications]);

  // 모든 알림 삭제
  const clearAll = useCallback(async () => {
    try {
      const response = await notificationAPI.clearAll();
      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Clear all error:', err);
    }
  }, []);

  // 알림 설정 조회
  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationAPI.getPreferences();
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (err) {
      console.error('Fetch preferences error:', err);
    }
  }, [isAuthenticated]);

  // 알림 설정 업데이트
  const updatePreferences = useCallback(async (data: Partial<NotificationPreference>) => {
    try {
      const response = await notificationAPI.updatePreferences(data);
      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (err) {
      console.error('Update preferences error:', err);
    }
  }, []);

  // 인증 상태 변경 시 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // 주기적으로 안읽은 알림 개수 업데이트 (1분마다)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchPreferences,
    updatePreferences,
    hasMore,
    currentPage,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
