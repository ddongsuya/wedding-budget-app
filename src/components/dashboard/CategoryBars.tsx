import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getIconByName } from '@/utils/iconMap';

interface CategoryBarProps {
  categories: Array<{
    name: string;
    budget: number;
    spent: number;
    color: string;
    icon: string;
  }>;
  onCategoryClick?: (name: string) => void;
}

export const CategoryBars: React.FC<CategoryBarProps> = ({ categories, onCategoryClick }) => {
  const navigate = useNavigate();
  
  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 0 }).format(n);

  const sortedCategories = [...categories]
    .filter(c => c.budget > 0)
    .sort((a, b) => {
      const aRatio = a.budget > 0 ? a.spent / a.budget : 0;
      const bRatio = b.budget > 0 ? b.spent / b.budget : 0;
      return bRatio - aRatio;
    })
    .slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-4 md:p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800 text-sm md:text-base">카테고리별 예산</h3>
        <button 
          onClick={() => navigate('/budget')}
          className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-0.5"
        >
          전체 보기 <ChevronRight size={14} />
        </button>
      </div>

      <div className="space-y-3 md:space-y-4">
        {sortedCategories.length > 0 ? sortedCategories.map((cat, index) => {
          const progress = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 150) : 0;
          const displayProgress = Math.min(progress, 100);
          const isOverBudget = cat.spent > cat.budget;

          return (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onCategoryClick?.(cat.name)}
              className="group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1 md:mb-1.5">
                <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                  {(() => {
                    const IconComponent = getIconByName(cat.icon);
                    return <IconComponent className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" style={{ color: cat.color }} />;
                  })()}
                  <span className="text-xs md:text-sm font-medium text-stone-700 group-hover:text-stone-900 truncate">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <span className={`text-xs md:text-sm font-semibold ${isOverBudget ? 'text-red-500' : 'text-stone-800'}`}>
                    {formatMoney(cat.spent)}
                  </span>
                  <span className="text-[10px] md:text-xs text-stone-400">
                    / {formatMoney(cat.budget)}
                  </span>
                </div>
              </div>

              <div className="relative h-1.5 md:h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                  className={`absolute left-0 top-0 h-full rounded-full ${
                    isOverBudget 
                      ? 'bg-gradient-to-r from-red-400 to-red-500' 
                      : ''
                  }`}
                  style={{ 
                    background: !isOverBudget 
                      ? `linear-gradient(90deg, ${cat.color}88, ${cat.color})` 
                      : undefined 
                  }}
                />
                
                {isOverBudget && (
                  <div 
                    className="absolute top-0 h-full w-0.5 bg-stone-400"
                    style={{ left: `${(cat.budget / cat.spent) * 100}%` }}
                  />
                )}
              </div>

              {isOverBudget && (
                <div className="flex items-center gap-1 mt-0.5 md:mt-1">
                  <span className="text-[10px] md:text-xs text-red-500 font-medium">
                    {formatMoney(cat.spent - cat.budget)} 초과
                  </span>
                </div>
              )}
            </motion.div>
          );
        }) : (
          <div className="py-8 text-center">
            <p className="text-sm text-stone-400">예산을 설정해주세요</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryBars;
