import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight } from 'lucide-react';

interface BudgetCategory {
  name: string;
  budget: number;
  spent: number;
  color: string;
}

interface BudgetDonutChartProps {
  categories: BudgetCategory[];
  totalBudget: number;
  totalSpent: number;
}

export const BudgetDonutChart: React.FC<BudgetDonutChartProps> = ({ 
  categories, 
  totalBudget, 
  totalSpent 
}) => {
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const chartData = categories
    .filter(c => c.spent > 0)
    .map(c => ({ name: c.name, value: c.spent, color: c.color }));

  if (remaining > 0) {
    chartData.push({ name: '남은 예산', value: remaining, color: '#e7e5e4' });
  }

  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-4 md:p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-stone-800 text-sm md:text-base">예산 현황</h3>
        <span className="text-[10px] md:text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
          전체
        </span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
        {/* 도넛 차트 */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="85%"
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl md:text-2xl font-bold text-stone-800">
              {spentPercentage.toFixed(0)}%
            </span>
            <span className="text-[10px] md:text-xs text-stone-400">사용</span>
          </div>
        </div>

        {/* 범례 & 인사이트 */}
        <div className="flex-1 space-y-3 w-full">
          <div className="space-y-2">
            <span className="text-[10px] md:text-xs font-medium text-stone-500 uppercase tracking-wider">
              TOP 지출
            </span>
            {categories
              .filter(c => c.spent > 0)
              .sort((a, b) => b.spent - a.spent)
              .slice(0, 3)
              .map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs md:text-sm text-stone-600 flex-1 truncate">{cat.name}</span>
                  <span className="text-xs md:text-sm font-semibold text-stone-800">
                    {formatMoney(cat.spent)}
                  </span>
                </div>
              ))
            }
            {categories.filter(c => c.spent > 0).length === 0 && (
              <p className="text-xs text-stone-400">아직 지출 내역이 없어요</p>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm text-stone-500">남은 예산</span>
              <span className={`text-base md:text-lg font-bold ${remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatMoney(Math.abs(remaining))}
                {remaining < 0 && <span className="text-xs ml-1">초과</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDonutChart;
