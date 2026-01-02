import React from 'react';
import { Heart, Calendar, Wallet, CheckSquare } from 'lucide-react';

interface WidgetData {
  dDay: number;
  budgetProgress: number;
  checklistProgress: number;
  upcomingEvent?: {
    title: string;
    date: string;
  };
}

interface WidgetProps {
  data: WidgetData;
}

// 작은 위젯 (2x1) - D-day만 표시
export const SmallWidget: React.FC<WidgetProps> = ({ data }) => (
  <div className="w-full h-full bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-4 text-white flex items-center justify-between">
    <div>
      <p className="text-rose-100 text-xs mb-1">결혼까지</p>
      <p className="text-3xl font-bold">
        {data.dDay > 0 ? `D-${data.dDay}` : data.dDay === 0 ? 'D-Day!' : `D+${Math.abs(data.dDay)}`}
      </p>
    </div>
    <Heart className="w-10 h-10 text-rose-300" fill="currentColor" />
  </div>
);

// 중간 위젯 (2x2) - D-day + 진행률
export const MediumWidget: React.FC<WidgetProps> = ({ data }) => (
  <div className="w-full h-full bg-white rounded-2xl p-4 shadow-lg flex flex-col">
    {/* 헤더 */}
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-medium text-stone-500">Wedding Planner</span>
      <Heart className="w-4 h-4 text-rose-500" fill="currentColor" />
    </div>

    {/* D-day */}
    <div className="text-center mb-4">
      <p className="text-4xl font-bold text-rose-500">
        {data.dDay > 0 ? `D-${data.dDay}` : data.dDay === 0 ? 'D-Day!' : `D+${Math.abs(data.dDay)}`}
      </p>
      <p className="text-xs text-stone-400 mt-1">결혼까지</p>
    </div>

    {/* 진행률 */}
    <div className="space-y-2 mt-auto">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-amber-500" />
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(data.budgetProgress, 100)}%` }}
          />
        </div>
        <span className="text-xs text-stone-500 w-8 text-right">{data.budgetProgress}%</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-emerald-500" />
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(data.checklistProgress, 100)}%` }}
          />
        </div>
        <span className="text-xs text-stone-500 w-8 text-right">{data.checklistProgress}%</span>
      </div>
    </div>
  </div>
);

// 큰 위젯 (4x2) - 전체 정보
export const LargeWidget: React.FC<WidgetProps> = ({ data }) => (
  <div className="w-full h-full bg-gradient-to-br from-rose-500 via-rose-500 to-pink-500 rounded-2xl p-5 text-white flex">
    {/* 왼쪽: D-day */}
    <div className="flex-1 flex flex-col justify-center">
      <p className="text-rose-100 text-sm mb-1">결혼까지</p>
      <p className="text-5xl font-bold mb-2">
        {data.dDay > 0 ? `D-${data.dDay}` : data.dDay === 0 ? 'D-Day!' : `D+${Math.abs(data.dDay)}`}
      </p>
      <div className="flex items-center gap-4 mt-4">
        <div>
          <p className="text-rose-200 text-xs">예산</p>
          <p className="font-bold">{data.budgetProgress}%</p>
        </div>
        <div>
          <p className="text-rose-200 text-xs">체크리스트</p>
          <p className="font-bold">{data.checklistProgress}%</p>
        </div>
      </div>
    </div>

    {/* 오른쪽: 다가오는 일정 */}
    <div className="w-40 bg-white/20 rounded-xl p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4" />
        <span className="text-xs font-medium">다가오는 일정</span>
      </div>
      {data.upcomingEvent ? (
        <div>
          <p className="font-bold text-sm truncate">{data.upcomingEvent.title}</p>
          <p className="text-xs text-rose-100">{data.upcomingEvent.date}</p>
        </div>
      ) : (
        <p className="text-xs text-rose-200">예정된 일정이 없어요</p>
      )}
    </div>
  </div>
);

// 위젯 데이터 훅
export const useWidgetData = (): WidgetData => {
  // 실제 구현에서는 API나 Context에서 데이터를 가져옴
  // 여기서는 예시 데이터 반환
  return {
    dDay: 281,
    budgetProgress: 45,
    checklistProgress: 32,
    upcomingEvent: {
      title: '웨딩홀 투어',
      date: '2025.01.15',
    },
  };
};

export default { SmallWidget, MediumWidget, LargeWidget, useWidgetData };
