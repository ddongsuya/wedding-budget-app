import React from 'react';
import { Heart, Bell, Settings, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface CompactHeaderProps {
  groomName: string;
  brideName: string;
  groomAvatar?: string | null;
  brideAvatar?: string | null;
  coupleNickname?: string;
  dDay: number;
  weddingDate?: string;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  groomName,
  brideName,
  groomAvatar,
  brideAvatar,
  coupleNickname,
  dDay,
  weddingDate,
  onNotificationClick,
  onSettingsClick,
}) => {
  const dDayDisplay = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day!' : `D+${Math.abs(dDay)}`;

  return (
    <div className="flex items-center justify-between py-3 md:py-4">
      {/* 좌측: 브랜드 + 커플 정보 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" fill="white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-stone-800 text-sm md:text-base truncate">
            {coupleNickname || 'Needless Wedding'}
          </h1>
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <span className="truncate">{groomName}</span>
            <Heart className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" fill="currentColor" />
            <span className="truncate">{brideName}</span>
          </div>
        </div>
      </div>

      {/* 우측: D-day + 액션 */}
      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-right">
          <span className="text-xl md:text-2xl font-bold text-rose-500">{dDayDisplay}</span>
          {weddingDate && (
            <p className="text-[10px] md:text-xs text-stone-400">{weddingDate}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
          <NavLink 
            to="/notifications"
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
          </NavLink>
          <NavLink 
            to="/settings"
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default CompactHeader;
