
import React, { useState } from 'react';
import { BudgetCategory } from '../../types';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface CategoryModalProps {
  initialData?: BudgetCategory | null;
  onSave: (category: BudgetCategory) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const PRESET_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#64748b'];
const ICONS = ['Building', 'Camera', 'Gem', 'Home', 'Plane', 'Gift', 'Utensils', 'Music', 'Flower', 'ShoppingBag'];

export const CategoryModal: React.FC<CategoryModalProps> = ({ initialData, onSave, onClose, onDelete }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [budgetAmount, setBudgetAmount] = useState(initialData?.budgetAmount || 0);
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(initialData?.icon || 'Gift');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const category: BudgetCategory = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name,
      budgetAmount: Number(budgetAmount),
      spentAmount: initialData?.spentAmount || 0,
      color,
      icon,
      parentId: null
    };
    onSave(category);
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 0) {
      value = String(parseInt(value, 10));
      if (isNaN(parseInt(value, 10))) value = '';
    }
    setBudgetAmount(value === '' ? 0 : parseInt(value, 10));
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center p-0 md:p-4 bg-white md:bg-stone-900/60 md:backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl shadow-none md:shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="text-xl font-bold text-stone-800">
            {initialData ? '카테고리 수정' : '새 카테고리 추가'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">카테고리 이름</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              placeholder="예: 가전제품"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">예산 금액</label>
            <input 
              type="text"
              inputMode="numeric"
              required
              value={budgetAmount > 0 ? budgetAmount.toLocaleString() : ''}
              onChange={handleAmountChange}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">색상 선택</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'border-stone-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-medium text-stone-700">아이콘 선택</label>
             <div className="flex flex-wrap gap-2 p-2 bg-stone-50 rounded-xl max-h-32 overflow-y-auto">
               {ICONS.map((ic) => (
                 <button
                   key={ic}
                   type="button"
                   onClick={() => setIcon(ic)}
                   className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${icon === ic ? 'bg-white border-stone-800 text-stone-900 shadow-sm' : 'border-transparent text-stone-500 hover:bg-stone-100'}`}
                 >
                   {ic}
                 </button>
               ))}
             </div>
          </div>
        </form>

        <div 
          className="p-4 border-t border-stone-100 flex gap-3 bg-white shrink-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
             {initialData && onDelete && (
               <Button type="button" variant="danger" onClick={() => { onDelete(initialData.id); onClose(); }}>삭제</Button>
             )}
             <Button type="button" className="flex-1" onClick={handleSubmit}>저장하기</Button>
        </div>
      </div>
    </div>
  );
}
