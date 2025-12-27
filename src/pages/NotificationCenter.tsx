import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Calendar, DollarSign, Heart, Megaphone, ListChecks } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationType } from '../api/notifications';
import { EmptyState } from '../components/common/EmptyState';

const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    hasMore,
    currentPage,
    unreadCount,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'dday_milestone':
      case 'dday_daily':
        return <Calendar size={20} className="text-rose-500" />;
      case 'schedule_reminder':
        return <Calendar size={20} className="text-blue-500" />;
      case 'checklist_due':
      case 'checklist_overdue':
        return <ListChecks size={20} className="text-orange-500" />;
      case 'budget_warning':
      case 'budget_exceeded':
        return <DollarSign size={20} className="text-yellow-500" />;
      case 'couple_activity':
        return <Heart size={20} className="text-pink-500" />;
      case 'announcement':
        return <Megaphone size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: NotificationType, isRead: boolean) => {
    if (isRead) return 'bg-white';
    
    switch (type) {
      case 'dday_milestone':
      case 'dday_daily':
        return 'bg-rose-50';
      case 'budget_warning':
      case 'budget_exceeded':
        return 'bg-yellow-50';
      case 'checklist_overdue':
        return 'bg-orange-50';
      default:
        return 'bg-blue-50';
    }
  };


  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchNotifications(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-lg px-4 py-4 shadow-soft sticky top-0 z-10 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-stone-600" />
            </button>
            <h1 className="text-lg font-semibold text-stone-800">알림</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full shadow-sm">
                {unreadCount}개 새 알림
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors"
                title="모두 읽음 처리"
              >
                <CheckCheck size={20} className="text-stone-600" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('모든 알림을 삭제하시겠습니까?')) {
                    clearAll();
                  }
                }}
                className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors"
                title="모두 삭제"
              >
                <Trash2 size={20} className="text-stone-600" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 알림 목록 */}
      <div className="p-4">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            illustration="notification"
            title="알림이 없습니다"
            description="새로운 알림이 오면 여기에 표시됩니다"
            actionLabel="알림 설정하기"
            onAction={() => navigate('/notifications/settings')}
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`${getNotificationBgColor(notification.type, notification.is_read)} 
                  rounded-xl p-4 cursor-pointer hover:shadow-md transition-all border border-gray-100 group`}
              >
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium text-gray-800 ${!notification.is_read ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <div className="flex items-center gap-1 mt-2">
                        <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                        <span className="text-xs text-rose-500 font-medium">새 알림</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            ))}

            {/* 더 보기 버튼 */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full py-3 text-center text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isLoading ? '로딩 중...' : '더 보기'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
