import React from 'react';
import { formatMoney } from '@/utils/formatMoney';

interface CategoryBudgetProgressProps {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
}

export const CategoryBudgetProgress: React.FC<CategoryBudgetProgressProps> = ({
  categoryName,
  budgetAmount,
  spentAmount,
}) => {
  const percentage = budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0;
  const isOverBudget = spentAmount > budgetAmount && budgetAmount > 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-700">{categoryName}</span>
        <span className={`text-xs font-medium ${isOverBudget ? 'text-red-500' : 'text-stone-500'}`}>
          {formatMoney(spentAmount)} / {formatMoney(budgetAmount)}
        </span>
      </div>
      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${categoryName} 예산 사용률`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isOverBudget && (
        <p className="text-xs text-red-500">
          예산 초과 {formatMoney(spentAmount - budgetAmount)}
        </p>
      )}
    </div>
  );
};
