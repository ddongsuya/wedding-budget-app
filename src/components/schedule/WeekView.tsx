import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Event {
  id: string | number;
  title: string;
  start_date: string;
  color: string;
}

interface WeekViewProps {
  currentDate: Date;
  events: Event[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  events,
  selectedDate,
  onDateSelect,
  onWeekChange,
}) => {
  // 현재 주의 시작일 (일요일)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // 날짜별 이벤트 매핑
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(event => {
    const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(event);
  });

  return (
    <div className="bg-white rounded-2xl p-4 shadow-card border border-stone-100">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => onWeekChange('prev')}
          className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={20} className="text-stone-600" />
        </button>
        
        <h3 className="font-bold text-stone-800">
          {format(weekStart, 'M월 d일', { locale: ko })} - {format(addDays(weekStart, 6), 'M월 d일', { locale: ko })}
        </h3>
        
        <button
          onClick={() => onWeekChange('next')}
          className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ChevronRight size={20} className="text-stone-600" />
        </button>
      </div>

      {/* 주간 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const dayOfWeek = day.getDay();

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(day)}
              className={`p-2 rounded-xl text-center transition-all flex flex-col items-center min-h-[70px] ${
                isSelected
                  ? 'bg-rose-500 text-white shadow-button'
                  : isTodayDate
                    ? 'bg-rose-50 text-rose-600'
                    : 'hover:bg-stone-50'
              }`}
            >
              {/* 요일 */}
              <div className={`text-[10px] font-medium mb-1 ${
                isSelected ? 'text-rose-100' :
                dayOfWeek === 0 ? 'text-red-400' : 
                dayOfWeek === 6 ? 'text-blue-400' : 
                'text-stone-400'
              }`}>
                {format(day, 'EEE', { locale: ko })}
              </div>
              
              {/* 날짜 */}
              <div className={`text-lg font-bold ${
                isSelected ? 'text-white' :
                dayOfWeek === 0 ? 'text-red-500' :
                dayOfWeek === 6 ? 'text-blue-500' :
                'text-stone-700'
              }`}>
                {format(day, 'd')}
              </div>
              
              {/* 이벤트 인디케이터 */}
              {hasEvents && (
                <div className="flex gap-0.5 mt-1">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`}
                      style={{ backgroundColor: isSelected ? undefined : event.color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeekView;
