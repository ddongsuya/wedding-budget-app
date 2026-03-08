import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Heart, CheckSquare, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { formatMoneyShort } from '@/utils/formatMoney';

interface KPIGridProps {
  dDay: number;
  totalBudget: number;
  spent: number;
  checklistProgress: number;
  overBudgetCount: number;
  checklistLoading?: boolean;
  groomRatio?: number;
  brideRatio?: number;
  onBudgetClick?: () => void;
  onChecklistClick?: () => void;
  onOverBudgetClick?: () => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ 
  dDay, 
  totalBudget, 
  spent, 
  checklistProgress, 
  overBudgetCount,
  checklistLoading = false,
  groomRatio = 50,
  brideRatio = 50,
  onBudgetClick,
  onChecklistClick,
  onOverBudgetClick,
}) => {
  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR').format(n);
  
  // 모바일용 축약 금액 포맷
  const formatMoneyCompact = (n: number) => formatMoneyShort(n);
  
  const remaining = totalBudget - spent;
  const dDayDisplay = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : `D+${Math.abs(dDay)}`;
  
  // 신랑/신부 예산 분담
  const groomBudget = Math.round(totalBudget * (groomRatio / 100));
  const brideBudget = Math.round(totalBudget * (brideRatio / 100));

  return (
    <div className="space-y-4">
      {/* 상단: D-Day + 준비 진행률 + 예산 초과 */}
      <div className="grid grid-cols-3 gap-3">
        {/* D-Day 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-4 text-white shadow-lg"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Heart className="w-4 h-4 fill-white" />
              <span className="text-xs font-medium text-white/90">결혼까지</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight">{dDayDisplay}</div>
            {dDay > 0 && dDay <= 30 && (
              <div className="mt-1 text-xs text-white/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />곧이에요!
              </div>
            )}
          </div>
        </motion.div>

        {/* 준비 진행률 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={onChecklistClick}
          className={`bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm ${onChecklistClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-stone-600">준비 진행률</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-bold text-stone-800">
              {checklistLoading ? '-' : checklistProgress}
            </span>
            <span className="text-sm text-stone-400">%</span>
          </div>
          <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: checklistLoading ? '0%' : `${checklistProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* 예산 초과 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onOverBudgetClick}
          className={`rounded-2xl border p-4 shadow-sm ${
            overBudgetCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-stone-200/60'
          } ${onOverBudgetClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className={`w-4 h-4 ${overBudgetCount > 0 ? 'text-red-600' : 'text-stone-400'}`} />
            <span className="text-xs font-medium text-stone-600">예산 초과</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl md:text-3xl font-bold ${overBudgetCount > 0 ? 'text-red-600' : 'text-stone-800'}`}>
              {overBudgetCount}
            </span>
            <span className="text-sm text-stone-400">개</span>
          </div>
          <div className="mt-2 text-xs">
            {overBudgetCount > 0 ? (
              <span className="text-red-500 font-medium">확인 필요</span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />정상
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* 하단: 예산 현황 카드 (메인) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={onBudgetClick}
        className={`bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm ${onBudgetClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      >
        {/* 예산 요약 - 3열 */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5">
          <div>
            <p className="text-xs text-stone-500 mb-1">총 예산</p>
            <p className="text-sm text-stone-400 hidden md:block">설정된 총 예산</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500 mb-1">배정됨</p>
            <p className="text-lg md:text-3xl font-bold text-rose-600 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(totalBudget)}</span>
              <span className="hidden md:inline">₩{formatMoney(totalBudget)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 mb-1">지출액</p>
            <p className="text-base md:text-2xl font-semibold text-stone-600 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(spent)}</span>
              <span className="hidden md:inline">₩{formatMoney(spent)}</span>
            </p>
          </div>
        </div>

        {/* 남은 예산 안내 */}
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-sm text-emerald-700">
            아직 <span className="font-bold">{formatMoneyCompact(Math.max(0, remaining))}</span> 배정 가능
          </span>
        </div>

        {/* 신랑/신부 분담 비율 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-600">💙</span>
              <span className="text-stone-600">신랑측 {groomRatio}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-600">신부측 {brideRatio}%</span>
              <span className="text-pink-600">💗</span>
            </div>
          </div>
          
          <div className="h-3 rounded-full overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500"
              style={{ width: `${groomRatio}%` }}
            />
            <div 
              className="bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500"
              style={{ width: `${brideRatio}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="md:hidden">{formatMoneyCompact(groomBudget)}</span>
            <span className="hidden md:inline">₩{formatMoney(groomBudget)}</span>
            <span className="md:hidden">{formatMoneyCompact(brideBudget)}</span>
            <span className="hidden md:inline">₩{formatMoney(brideBudget)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KPIGrid;
