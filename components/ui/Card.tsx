import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = memo(({ children, className = '', title, action, interactive = false }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden transition-all duration-200 ${interactive ? 'card-interactive hover:shadow-soft-lg active:scale-[0.99]' : ''} ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-stone-50 flex justify-between items-center">
          {title && <h3 className="text-lg font-bold text-stone-800">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
});

Card.displayName = 'Card';

interface SummaryCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  trend?: string;
  delay?: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = memo(({ label, value, icon, trend, delay = 0 }) => (
  <div 
    className="bg-white p-5 rounded-2xl shadow-soft border border-stone-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-soft-lg transition-all duration-300 touch-feedback active:scale-[0.98] gpu-accelerate"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start z-10">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      {icon && <div className="text-rose-500 p-2 bg-rose-50 rounded-lg group-hover:scale-110 transition-transform duration-300">{icon}</div>}
    </div>
    <div className="z-10">
      <h4 className="text-2xl font-bold text-stone-900 tracking-tight">{value}</h4>
      {trend && <p className="text-xs text-stone-400 mt-1">{trend}</p>}
    </div>
    {/* Decorative circle */}
    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-rose-50 to-transparent rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
  </div>
));

SummaryCard.displayName = 'SummaryCard';
