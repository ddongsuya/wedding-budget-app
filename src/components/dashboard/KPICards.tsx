import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Wallet, CheckSquare, AlertTriangle, Heart, TrendingUp } from 'lucide-react';

interface KPIGridProps {
  dDay: number;
  totalBudget: number;
  spent: number;
  checklistProgress: number;
  overBudgetCount: number;
  checklistLoading?: boolean;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ 
  dDay, 
  totalBudget, 
  spent, 
  checklistProgress, 
  overBudgetCount,
  checklistLoading = false,
}) => {
  const formatMoney = (n: number) => 
    new Intl.NumberFormat('ko-KR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  
  const budgetProgress = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;
  const remaining = totalBudget - spent;
  const dDayDisplay = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day' : `D+${Math.abs(dDay)}`;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {/* D-Day 카드 - 메인 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-2 md:col-span-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 p-5 text-white shadow-lg"
      >
        <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-2 w-16 h-16 rounded-full bg-white/5" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="text-sm font-medium text-white/90">결혼까지</span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-bold tracking-tight">{dDayDisplay}</span>
            {dDay <= 30 && dDay > 0 && (
              <span className="text-sm text-white/80">곧이에요! 💕</span>
            )}
          </div>
          
          {dDay > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs text-white/70">
                {dDay <= 7 ? '일주일 이내!' : dDay <= 30 ? '한 달 이내' : `${Math.floor(dDay / 30)}개월 ${dDay % 30}일`}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* 예산 현황 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="col-span-2 md:col-span-1 bg-white rounded-2xl border border-stone-200/60 p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-stone-600">예산 현황</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            budgetProgress > 90 ? 'bg-red-100 text-red-600' :
            budgetProgress > 70 ? 'bg-amber-100 text-amber-600' :
            'bg-emerald-100 text-emerald-600'
          }`}>
            {budgetProgress}% 사용
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-stone-500 mb-1.5">
              <span>지출 {formatMoney(spent)}</span>
              <span>총 {formatMoney(totalBudget)}</span>
            </div>
            <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(budgetProgress, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  budgetProgress > 90 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                  budgetProgress > 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-emerald-400 to-emerald-500'
                }`}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-500">남은 예산</span>
            <span className={`text-lg font-bold ${remaining >= 0 ? 'text-stone-800' : 'text-red-600'}`}>
              {remaining >= 0 ? formatMoney(remaining) : `-${formatMoney(Math.abs(remaining))}`}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 준비 진행률 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-stone-200/60 p-4 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-stone-600">준비 진행률</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-stone-800">
              {checklistLoading ? '-' : checklistProgress}
            </span>
            <span className="text-lg text-stone-400 ml-0.5">%</span>
          </div>
          
          {!checklistLoading && (
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="w-3 h-3" />
              <span>진행 중</span>
            </div>
          )}
        </div>

        {/* 미니 프로그레스 바 */}
        <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: checklistLoading ? '0%' : `${checklistProgress}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
          />
        </div>
      </motion.div>

      {/* 예산 초과 알림 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className={`rounded-2xl border p-4 shadow-sm ${
          overBudgetCount > 0 
            ? 'bg-red-50 border-red-100' 
            : 'bg-white border-stone-200/60'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            overBudgetCount > 0 ? 'bg-red-100' : 'bg-stone-100'
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${
              overBudgetCount > 0 ? 'text-red-600' : 'text-stone-400'
            }`} />
          </div>
          <span className="text-xs font-medium text-stone-600">예산 초과</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className={`text-3xl font-bold ${
              overBudgetCount > 0 ? 'text-red-600' : 'text-stone-800'
            }`}>
              {overBudgetCount}
            </span>
            <span className="text-sm text-stone-400 ml-1">개</span>
          </div>
          
          {overBudgetCount > 0 ? (
            <span className="text-xs text-red-500 font-medium">확인 필요</span>
          ) : (
            <span className="text-xs text-emerald-600 font-medium">정상 ✓</span>
          )}
        </div>

        {/* 상태 인디케이터 */}
        <div className="mt-3 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className={`flex-1 h-1.5 rounded-full ${
                i < overBudgetCount 
                  ? 'bg-red-400' 
                  : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default KPIGrid;
