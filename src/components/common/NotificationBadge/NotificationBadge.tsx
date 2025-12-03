import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../contexts/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
  iconSize?: number;
  onClick?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  className = '',
  iconSize = 24,
  onClick,
}) => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/notifications');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
      aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개의 새 알림)` : ''}`}
    >
      <Bell size={iconSize} className="text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;
