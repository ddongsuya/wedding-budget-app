import React from 'react';
import { formatMoneyShort } from '@/utils/formatMoney';

export interface MonthlyData {
  month: string;   // e.g. '2025-01', '2025-02'
  total: number;
}

interface MonthlyExpenseChartProps {
  monthlyData: MonthlyData[];
}

/**
 * 월별 지출 데이터를 집계하는 순수 함수 (테스트 가능).
 * expenses 배열에서 최근 months개월의 월별 합계를 계산한다.
 */
export function aggregateMonthlyExpenses(
  expenses: { paymentDate: string; amount: number }[],
  months: number = 6
): MonthlyData[] {
  const now = new Date();
  const result: MonthlyData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ month: key, total: 0 });
  }

  for (const expense of expenses) {
    if (!expense.paymentDate) continue;
    const date = new Date(expense.paymentDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const entry = result.find(r => r.month === key);
    if (entry) {
      entry.total += expense.amount;
    }
  }

  return result;
}

/** 월 키를 한국어 표시 형식으로 변환 */
function formatMonthLabel(month: string): string {
  const parts = month.split('-');
  if (parts.length !== 2) return month;
  return `${parseInt(parts[1])}월`;
}

export const MonthlyExpenseChart: React.FC<MonthlyExpenseChartProps> = ({ monthlyData }) => {
  if (monthlyData.length === 0) return null;

  const maxTotal = Math.max(...monthlyData.map(d => d.total), 1);

  return (
    <div className="bg-white rounded-xl border border-stone-100 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-stone-700">월별 지출 추이</h3>
      <div className="flex items-end gap-2 h-32">
        {monthlyData.map((data) => {
          const heightPercent = maxTotal > 0 ? (data.total / maxTotal) * 100 : 0;
          return (
            <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-stone-500 whitespace-nowrap">
                {data.total > 0 ? formatMoneyShort(data.total) : '-'}
              </span>
              <div className="w-full flex items-end" style={{ height: '80px' }}>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-rose-400 to-rose-300 transition-all duration-300"
                  style={{ height: `${Math.max(heightPercent, 2)}%` }}
                />
              </div>
              <span className="text-[10px] text-stone-400">{formatMonthLabel(data.month)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyExpenseChart;
