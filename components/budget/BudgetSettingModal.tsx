
import React, { useState, useEffect } from 'react';
import { BudgetSettings } from '../../types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { X, Wallet, Heart } from 'lucide-react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface BudgetSettingModalProps {
  settings: BudgetSettings;
  onSave: (settings: Partial<BudgetSettings>) => Promise<void> | void;
  onClose: () => void;
}

export const BudgetSettingModal: React.FC<BudgetSettingModalProps> = ({ settings, onSave, onClose }) => {
  const [totalBudget, setTotalBudget] = useState(settings.totalBudget);
  const [weddingDate, setWeddingDate] = useState(settings.weddingDate);
  const [groomRatio, setGroomRatio] = useState(settings.groomRatio);
  const [isSaving, setIsSaving] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    controls.start({ y: 0 });
    return () => { document.body.style.overflow = 'unset'; };
  }, [controls]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleDragEnd = (event: any, info: { offset: { y: number }; velocity: { y: number } }) => {
    const { offset, velocity } = info;
    if (offset.y > 100 || velocity.y > 500) {
      controls.start({ y: '100%' }).then(onClose);
    } else {
      controls.start({ y: 0 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        totalBudget,
        weddingDate,
        groomRatio,
        brideRatio: 100 - groomRatio,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
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

  const formContent = (
    <>
      {/* Total Budget */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700 flex items-center gap-2">
          <Wallet size={16} /> 총 결혼 예산
        </label>
        <div className="relative">
          <input 
            type="text" 
            inputMode="numeric"
            pattern="[0-9,]*"
            value={totalBudget > 0 ? totalBudget.toLocaleString() : ''} 
            onChange={handleBudgetChange}
            className="w-full pl-4 pr-12 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none font-bold text-lg"
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
          className="w-full h-3 min-h-[44px] bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800 touch-feedback"
          style={{
            backgroundImage: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${groomRatio}%, #f43f5e ${groomRatio}%, #f43f5e 100%)`
          }}
        />
        <p className="text-xs text-stone-400 text-center">슬라이더를 움직여 비율을 조정하세요</p>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {/* Mobile Bottom Sheet */}
      <>
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] md:hidden"
          onClick={onClose}
        />
        
        {/* Mobile Sheet */}
        <motion.div 
          initial={{ y: '100%' }}
          animate={controls}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.2 }}
          onDragEnd={handleDragEnd}
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] z-[70] md:hidden touch-feedback"
          role="dialog"
          aria-modal="true"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
          </div>

          <div className="px-4 pb-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-800">예산 설정</h3>
            <button 
              onClick={onClose} 
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full transition-colors touch-feedback"
              aria-label="닫기"
            >
              <X size={20} className="text-stone-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6">
            {formContent}
          </form>

          <div className="p-4 border-t border-stone-100 safe-area-pb-min bg-white">
            <Button type="button" className="w-full" onClick={handleSubmit} loading={isSaving} disabled={isSaving}>
              {isSaving ? '저장 중...' : '저장하기'}
            </Button>
          </div>
        </motion.div>

        {/* Desktop Modal */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="hidden md:flex fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[60] items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-h-[90vh] max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-stone-800">예산 설정</h3>
              <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formContent}
            </form>

            <div className="p-4 border-t border-stone-100 bg-white">
              <Button type="button" className="w-full" onClick={handleSubmit} loading={isSaving} disabled={isSaving}>
                {isSaving ? '저장 중...' : '저장하기'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};
