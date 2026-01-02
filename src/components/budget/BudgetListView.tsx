import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { getIconByName } from '@/utils/iconMap';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  budgetAmount: number;
  spentAmount: number;
}

interface BudgetListViewProps {
  categories: BudgetCategory[];
  onCategoryClick: (category: BudgetCategory) => void;
}

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

const CategoryListItem: React.FC<{ category: BudgetCategory; onClick: () => void }> = ({ category, onClick }) => {
  const progress = category.budgetAmount > 0 
    ? Math.min((category.spentAmount / category.budgetAmount) * 100, 100) 
    : 0;
  const isOverBudget = category.spentAmount > category.budgetAmount && category.budgetAmount > 0;
  const IconComponent = getIconByName(category.icon);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-stone-100 flex items-center gap-4 hover:shadow-md transition-all cursor-pointer touch-feedback active:scale-[0.99]"
    >
      {/* 아이콘 */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: category.color }}
      >
        <IconComponent size={20} />
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-stone-800 truncate">{category.name}</span>
          <span className={`text-sm font-bold ${isOverBudget ? 'text-red-500' : 'text-stone-700'}`}>
            {formatMoney(category.spentAmount)}
          </span>
        </div>

        {/* 진행 바 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: isOverBudget ? '#ef4444' : category.color,
              }}
            />
          </div>
          <span className="text-xs text-stone-500 w-20 text-right">
            {formatMoney(category.budgetAmount)}
          </span>
        </div>
      </div>

      {/* 화살표 */}
      <ChevronRight size={18} className="text-stone-300 flex-shrink-0" />
    </div>
  );
};

export const BudgetListView: React.FC<BudgetListViewProps> = ({ categories, onCategoryClick }) => {
  const [showInactive, setShowInactive] = useState(false);

  // 지출 있는 항목과 없는 항목 분리
  const activeCategories = categories.filter(c => c.spentAmount > 0);
  const inactiveCategories = categories.filter(c => c.spentAmount === 0);

  return (
    <div className="space-y-2">
      {/* 활성 카테고리 (지출 있음) */}
      {activeCategories.map((category, index) => (
        <div key={category.id} className="stagger-item" style={{ animationDelay: `${index * 30}ms` }}>
          <CategoryListItem category={category} onClick={() => onCategoryClick(category)} />
        </div>
      ))}

      {/* 비활성 카테고리 토글 */}
      {inactiveCategories.length > 0 && (
        <>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="w-full py-3 text-sm text-stone-500 hover:text-stone-700 flex items-center justify-center gap-2 transition-colors"
          >
            {showInactive ? '접기' : `미사용 항목 ${inactiveCategories.length}개 보기`}
            <ChevronDown
              size={16}
              className={`transition-transform ${showInactive ? 'rotate-180' : ''}`}
            />
          </button>

          {showInactive && (
            <div className="space-y-2 opacity-70">
              {inactiveCategories.map((category, index) => (
                <div key={category.id} className="stagger-item" style={{ animationDelay: `${index * 30}ms` }}>
                  <CategoryListItem category={category} onClick={() => onCategoryClick(category)} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BudgetListView;
