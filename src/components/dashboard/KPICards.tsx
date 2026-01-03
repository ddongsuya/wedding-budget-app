import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Calendar, Wallet, CheckSquare, AlertTriangle } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  accentColor: string;
  priority?: 'primary' | 'secondary';
  alert?: boolean;
  delay?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  accentColor,
  priority = 'secondary',
  alert = false,
  delay = 0,
}) => {
  const isPrimary = priority === 'primary';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.001 }}
      className={`
        relative overflow-hidden rounded-2xl p-4 md:p-5
        ${isPrimary 
          ? `bg-gradient-to-br ${accentColor} text-white shadow-lg` 
          : 'bg-white border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow'
        }
      `}
    >
      {isPrimary && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </div>
      )}

      {alert && (
        <div className="absolute top-3 right-3">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <span className={`text-xs md:text-sm font-medium ${isPrimary ? 'text-white/80' : 'text-stone-500'}`}>
            {label}
          </span>
          <div className={`
            w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center
            ${isPrimary ? 'bg-white/20' : 'bg-stone-100'}
          `}>
            {icon}
          </div>
        </div>

        <div className="mb-1 md:mb-2">
          <span className={`
            text-2xl md:text-3xl font-bold tracking-tight
            ${isPrimary ? 'text-white' : 'text-stone-800'}
          `}>
            {value}
          </span>
          {subValue && (
            <span className={`text-xs md:text-sm ml-1 md:ml-2 ${isPrimary ? 'text-white/70' : 'text-stone-400'}`}>
              {subValue}
            </span>
          )}
        </div>

        {trend && (
          <div className={`flex items-center gap-1 text-xs md:text-sm ${isPrimary ? 'text-white/90' : ''}`}>
            {trend.direction === 'up' && (
              <TrendingUp className={`w-3 h-3 md:w-4 md:h-4 ${isPrimary ? '' : 'text-emerald-500'}`} />
            )}
            {trend.direction === 'down' && (
              <TrendingDown className={`w-3 h-3 md:w-4 md:h-4 ${isPrimary ? '' : 'text-red-500'}`} />
            )}
            {trend.direction === 'neutral' && (
              <Minus className={`w-3 h-3 md:w-4 md:h-4 ${isPrimary ? '' : 'text-stone-400'}`} />
            )}
            <span className={`font-medium ${
              !isPrimary && (
                trend.direction === 'up' ? 'text-emerald-600' :
                trend.direction === 'down' ? 'text-red-600' : 'text-stone-500'
              )
            }`}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            <span className={isPrimary ? 'text-white/70' : 'text-stone-400'}>
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

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
  
  const budgetProgress = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const dDayDisplay = dDay > 0 ? `D-${dDay}` : dDay === 0 ? 'D-Day!' : `D+${Math.abs(dDay)}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <KPICard
        label="결혼까지"
        value={dDayDisplay}
        subValue={dDay <= 30 && dDay > 0 ? '곧이에요!' : undefined}
        icon={<Calendar className="w-4 h-4 md:w-5 md:h-5 text-white" />}
        accentColor="from-rose-500 to-pink-600"
        priority="primary"
        alert={dDay <= 7 && dDay > 0}
        delay={0}
      />

      <KPICard
        label="예산 사용"
        value={`${budgetProgress.toFixed(0)}%`}
        subValue={`/ ${formatMoney(totalBudget)}`}
        trend={{
          value: Math.round(budgetProgress - 50),
          label: '목표 대비',
          direction: budgetProgress > 80 ? 'up' : budgetProgress < 30 ? 'down' : 'neutral',
        }}
        icon={<Wallet className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />}
        accentColor=""
        alert={budgetProgress > 90}
        delay={50}
      />

      <KPICard
        label="준비 진행률"
        value={checklistLoading ? '-' : `${checklistProgress}%`}
        subValue={checklistLoading ? '로딩 중' : '완료'}
        trend={checklistLoading ? undefined : {
          value: 5,
          label: '지난주 대비',
          direction: 'up',
        }}
        icon={<CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />}
        accentColor=""
        delay={100}
      />

      <KPICard
        label="예산 초과"
        value={overBudgetCount}
        subValue="개 항목"
        icon={<AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-500" />}
        accentColor=""
        alert={overBudgetCount > 0}
        delay={150}
      />
    </div>
  );
};

export default KPIGrid;
