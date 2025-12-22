
import React, { useState, useEffect } from 'react';
import { BudgetCategory } from '../../types';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';
import { iconMap, ICON_CATEGORIES } from '../../src/utils/iconMap';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

interface CategoryModalProps {
  initialData?: BudgetCategory | null;
  onSave: (category: BudgetCategory) => Promise<void> | void;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void> | void;
}

const PRESET_COLORS = ['#f43f5e', '#ec4899', '#d946ef', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#14b8a6', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#64748b'];

export const CategoryModal: React.FC<CategoryModalProps> = ({ initialData, onSave, onClose, onDelete }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [budgetAmount, setBudgetAmount] = useState(initialData?.budgetAmount || 0);
  const [color, setColor] = useState(initialData?.color || PRESET_COLORS[0]);
  const [icon, setIcon] = useState(initialData?.icon || 'Gift');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
      const category: BudgetCategory = {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        name,
        budgetAmount: Number(budgetAmount),
        spentAmount: initialData?.spentAmount || 0,
        color,
        icon,
        parentId: null
      };
      await onSave(category);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 0) {
      value = String(parseInt(value, 10));
      if (isNaN(parseInt(value, 10))) value = '';
    }
    setBudgetAmount(value === '' ? 0 : parseInt(value, 10));
  };

  const formContent = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">카테고리 이름</label>
        <input 
          required
          name="category_name"
          type="text"
          autoCapitalize="words"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-base"
          placeholder="예: 가전제품"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700">예산 금액</label>
        <input 
          type="text"
          inputMode="numeric"
          pattern="[0-9,]*"
          required
          value={budgetAmount > 0 ? budgetAmount.toLocaleString() : ''}
          onChange={handleAmountChange}
          className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-base"
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
              className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full border-2 transition-transform touch-feedback ${color === c ? 'border-stone-800 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              aria-label={`색상 ${c}`}
            />
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
         <label className="text-sm font-medium text-stone-700">아이콘 선택</label>
         <div className="bg-stone-50 rounded-xl p-3 max-h-48 overflow-y-auto space-y-3">
           {ICON_CATEGORIES.map((category) => (
             <div key={category.name}>
               <p className="text-xs text-stone-400 mb-2 font-medium">{category.name}</p>
               <div className="flex flex-wrap gap-2">
                 {category.icons.map((iconName) => {
                   const IconComponent = iconMap[iconName];
                   if (!IconComponent) return null;
                   return (
                     <button
                       key={iconName}
                       type="button"
                       onClick={() => setIcon(iconName)}
                       className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg border-2 flex items-center justify-center transition-all touch-feedback ${
                         icon === iconName 
                           ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-sm scale-110' 
                           : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-100'
                       }`}
                       title={iconName}
                       aria-label={`아이콘 ${iconName}`}
                     >
                       <IconComponent size={20} />
                     </button>
                   );
                 })}
               </div>
             </div>
           ))}
         </div>
         {/* 선택된 아이콘 미리보기 */}
         <div className="flex items-center gap-2 mt-2 p-2 bg-stone-100 rounded-lg">
           <span className="text-xs text-stone-500">선택됨:</span>
           <div 
             className="w-8 h-8 rounded-full flex items-center justify-center text-white"
             style={{ backgroundColor: color }}
           >
             {(() => {
               const SelectedIcon = iconMap[icon];
               return SelectedIcon ? <SelectedIcon size={16} /> : null;
             })()}
           </div>
           <span className="text-sm font-medium text-stone-700">{icon}</span>
         </div>
      </div>
    </>
  );

  const actionButtons = (
    <div className="flex gap-3">
      {initialData && onDelete && (
        <Button type="button" variant="danger" onClick={handleDelete} loading={isDeleting} disabled={isDeleting || isSaving}>
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      )}
      <Button type="button" className="flex-1" onClick={handleSubmit} loading={isSaving} disabled={isSaving || isDeleting}>
        {isSaving ? '저장 중...' : '저장하기'}
      </Button>
    </div>
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
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] z-[70] md:hidden touch-feedback"
          role="dialog"
          aria-modal="true"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-stone-300 rounded-full"></div>
          </div>

          <div className="px-4 pb-3 border-b border-stone-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-stone-800">
              {initialData ? '카테고리 수정' : '새 카테고리 추가'}
            </h3>
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

          <div className="p-4 border-t border-stone-100 safe-area-pb bg-white">
            {actionButtons}
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
              <h3 className="text-xl font-bold text-stone-800">
                {initialData ? '카테고리 수정' : '새 카테고리 추가'}
              </h3>
              <button onClick={onClose} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formContent}
            </form>

            <div className="p-4 border-t border-stone-100 bg-white">
              {actionButtons}
            </div>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}
