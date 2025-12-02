import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { ChecklistItem } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, CheckSquare, Trash2, CalendarClock } from 'lucide-react';

const PERIODS = ['D-180', 'D-100', 'D-60', 'D-30', 'D-7', 'D-Day'] as const;

export const Checklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPeriod, setNewItemPeriod] = useState<typeof PERIODS[number]>('D-180');

  useEffect(() => {
    setItems(StorageService.getChecklist());
  }, []);

  const handleToggle = (id: string) => {
    const updated = StorageService.toggleChecklistItem(id);
    setItems(updated);
  };

  const handleDelete = (id: string) => {
    if (confirm('삭제하시겠습니까?')) {
      const updated = StorageService.deleteChecklistItem(id);
      setItems(updated);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newItemTitle,
      period: newItemPeriod,
      isCompleted: false
    };

    const updated = StorageService.addChecklistItem(newItem);
    setItems(updated);
    setNewItemTitle('');
    setIsAdding(false);
  };

  const calculateProgress = (periodItems: ChecklistItem[]) => {
    if (periodItems.length === 0) return 0;
    const completed = periodItems.filter(i => i.isCompleted).length;
    return Math.round((completed / periodItems.length) * 100);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">체크리스트</h2>
          <p className="text-stone-500 text-sm">시기별로 준비해야 할 항목들을 점검하세요.</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setIsAdding(true)}>
          항목 추가
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 animate-fade-in mb-6 border-rose-200 ring-4 ring-rose-50">
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3">
             <select 
               value={newItemPeriod}
               onChange={(e) => setNewItemPeriod(e.target.value as any)}
               className="px-4 py-2 rounded-xl border border-stone-200 outline-none focus:border-rose-500 min-w-[120px]"
             >
               {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
             <input 
               autoFocus
               type="text" 
               placeholder="할 일을 입력하세요" 
               value={newItemTitle}
               onChange={(e) => setNewItemTitle(e.target.value)}
               className="flex-1 px-4 py-2 rounded-xl border border-stone-200 outline-none focus:border-rose-500"
             />
             <div className="flex gap-2">
               <Button type="submit">추가</Button>
               <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>취소</Button>
             </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PERIODS.map(period => {
          const periodItems = items.filter(i => i.period === period);
          const progress = calculateProgress(periodItems);
          
          return (
            <Card key={period} className="overflow-hidden">
               <div className="px-5 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <div className="bg-white p-1.5 rounded-lg shadow-sm text-rose-500">
                        <CalendarClock size={16} />
                     </div>
                     <h3 className="font-bold text-stone-800">{period}</h3>
                  </div>
                  <span className="text-xs font-medium text-stone-500">{progress}% 완료</span>
               </div>
               
               {/* Progress Bar */}
               <div className="h-1 w-full bg-stone-100">
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
               </div>

               <div className="p-2">
                 {periodItems.length > 0 ? (
                   <div className="space-y-1">
                     {periodItems.map(item => (
                       <div key={item.id} className="group flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors">
                          <label className="flex items-center gap-3 cursor-pointer flex-1">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.isCompleted ? 'bg-rose-500 border-rose-500' : 'bg-white border-stone-300'}`}>
                                {item.isCompleted && <CheckSquare size={14} className="text-white" />}
                             </div>
                             <input type="checkbox" className="hidden" checked={item.isCompleted} onChange={() => handleToggle(item.id)} />
                             <span className={`text-sm ${item.isCompleted ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                               {item.title}
                             </span>
                          </label>
                          <button onClick={() => handleDelete(item.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                             <Trash2 size={16} />
                          </button>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-8 text-center text-stone-400 text-sm">
                     등록된 항목이 없습니다.
                   </div>
                 )}
               </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};