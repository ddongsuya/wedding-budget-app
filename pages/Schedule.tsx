import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { ScheduleItem } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DatePicker } from '../components/ui/DatePicker';
import { Plus, MapPin, Clock, CalendarDays, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Schedule: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationState, setLocationState] = useState('');
  const [type, setType] = useState<ScheduleItem['type']>('meeting');

  const location = useLocation();

  useEffect(() => {
    const loaded = StorageService.getSchedule();
    // Sort by date
    setSchedules(loaded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, []);

  // Handle opening form from FAB (via router state)
  useEffect(() => {
    if (location.state && (location.state as any).openAdd) {
       setIsAdding(true);
       window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleDelete = (id: string) => {
    if (confirm('일정을 삭제하시겠습니까?')) {
      const updated = StorageService.deleteScheduleItem(id);
      setSchedules(updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    const newItem: ScheduleItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      date,
      time,
      location: locationState,
      type
    };

    const updated = StorageService.addScheduleItem(newItem);
    setSchedules(updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    
    // Reset
    setTitle('');
    setDate('');
    setTime('');
    setLocationState('');
    setIsAdding(false);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'meeting': return '미팅/상담';
      case 'fitting': return '드레스 가봉';
      case 'payment': return '결제일';
      default: return '기타';
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'meeting': return 'bg-blue-100 text-blue-700';
      case 'fitting': return 'bg-rose-100 text-rose-700';
      case 'payment': return 'bg-amber-100 text-amber-700';
      default: return 'bg-stone-100 text-stone-600';
    }
  };

  // Group by Month
  const groupedSchedules = schedules.reduce((acc, item) => {
    const month = item.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const sortedMonths = Object.keys(groupedSchedules).sort();

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">일정 관리</h2>
          <p className="text-stone-500 text-sm">주요 웨딩 일정을 관리하세요.</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsAdding(true)}>
          일정 추가
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 animate-fade-in border-rose-200 ring-4 ring-rose-50">
          <h3 className="text-lg font-bold text-stone-800 mb-4">새 일정 추가</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500">일정명</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500" placeholder="예: 드레스 투어" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500">유형</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500 bg-white">
                  <option value="meeting">미팅/상담</option>
                  <option value="fitting">드레스 가봉</option>
                  <option value="payment">결제일</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div className="space-y-1">
                <DatePicker 
                  label="날짜"
                  value={date} 
                  onChange={(d) => setDate(d)} 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-500">시간</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-stone-500">장소 (선택)</label>
                <input type="text" value={locationState} onChange={(e) => setLocationState(e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500" placeholder="예: 청담동 OO샵" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
               <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>취소</Button>
               <Button type="submit">저장</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Timeline View */}
      <div className="space-y-8">
        {sortedMonths.length > 0 ? (
          sortedMonths.map(month => (
            <div key={month}>
              <h3 className="text-lg font-bold text-stone-600 mb-4 sticky top-16 bg-stone-50 py-2 z-10 flex items-center gap-2">
                <CalendarDays size={20} className="text-rose-500"/>
                {month.replace('-', '. ')}
              </h3>
              <div className="space-y-3 pl-2 md:pl-4 border-l-2 border-stone-200 ml-2 md:ml-3">
                {groupedSchedules[month].map(item => (
                  <div key={item.id} className="relative pl-6">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[9px] top-4 w-4 h-4 rounded-full bg-white border-4 border-rose-300"></div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100 hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getTypeColor(item.type)}`}>
                               {getTypeLabel(item.type)}
                             </span>
                             <span className="text-stone-400 text-xs font-medium">{item.date} {item.time}</span>
                           </div>
                           <h4 className="font-bold text-stone-800 text-lg">{item.title}</h4>
                           {item.location && (
                             <div className="flex items-center gap-1 text-stone-500 text-sm mt-1">
                               <MapPin size={14} /> {item.location}
                             </div>
                           )}
                        </div>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
           <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
             <CalendarDays size={48} className="mx-auto text-stone-300 mb-4" />
             <p className="text-stone-500 font-medium">등록된 일정이 없습니다.</p>
             <p className="text-stone-400 text-sm">결혼 준비 일정을 등록해보세요.</p>
           </div>
        )}
      </div>
    </div>
  );
};