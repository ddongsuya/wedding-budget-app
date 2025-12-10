
import React, { useState } from 'react';
import { BudgetSettings } from '../../types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { X, Calendar, Wallet, Heart } from 'lucide-react';

interface BudgetSettingModalProps {
  settings: BudgetSettings;
  onSave: (settings: Partial<BudgetSettings>) => void;
  onClose: () => void;
}

export const BudgetSettingModal: React.FC<BudgetSettingModalProps> = ({ settings, onSave, onClose }) => {
  const [totalBudget, setTotalBudget] = useState(settings.totalBudget);
  const [weddingDate, setWeddingDate] = useState(settings.weddingDate);
  const [groomRatio, setGroomRatio] = useState(settings.groomRatio);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      totalBudget,
      weddingDate,
      groomRatio,
      brideRatio: 100 - groomRatio,
    });
    onClose();
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 0) {
      value = String(parseInt(value, 10));
      if (isNaN(parseInt(value, 10))) value = '';
    }
    setTotalBudget(value === '' ? 0 : parseInt(value, 10));
  };

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(val);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center p-0 md:p-4 bg-white md:bg-stone-900/60 md:backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-2xl shadow-none md:shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="text-xl font-bold text-stone-800">예산 설정</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Total Budget */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <Wallet size={16} /> 총 결혼 예산
            </label>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric"
                value={totalBudget > 0 ? totalBudget.toLocaleString() : ''} 
                onChange={handleBudgetChange}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-bold text-lg"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">원</span>
            </div>
            <p className="text-xs text-rose-500 text-right">{formatMoney(totalBudget)}</p>
          </div>

          {/* Wedding Date */}
          <div className="space-y-2">
            <DatePicker
              label="결혼 예정일"
              value={weddingDate}
              onChange={(date) => setWeddingDate(date)}
            />
          </div>

          {/* Contribution Ratio */}
          <div className="space-y-4 pt-4 border-t border-stone-100">
             <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
              <Heart size={16} /> 예산 분담 비율
            </label>
            
            <div className="flex items-center justify-between text-sm font-bold mb-2">
              <span className="text-blue-600">신랑 {groomRatio}%</span>
              <span className="text-rose-500">신부 {100 - groomRatio}%</span>
            </div>

            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={groomRatio}
              onChange={(e) => setGroomRatio(Number(e.target.value))}
              className="w-full h-3 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
              style={{
                backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${groomRatio}%, #f43f5e ${groomRatio}%, #f43f5e 100%)`
              }}
            />
            <p className="text-xs text-stone-400 text-center">슬라이더를 움직여 비율을 조정하세요</p>
          </div>
        </form>

        <div 
          className="p-4 border-t border-stone-100 flex gap-3 bg-white shrink-0"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
           <Button type="button" className="w-full" onClick={handleSubmit}>저장하기</Button>
        </div>
      </div>
    </div>
  );
};
