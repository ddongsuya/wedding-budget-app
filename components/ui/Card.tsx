import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  interactive?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = memo(({ 
  children, 
  className = '', 
  title, 
  subtitle,
  action, 
  interactive = false,
  variant = 'default',
  padding = 'md'
}) => {
  const variants = {
    default: 'bg-white border border-stone-100/80 shadow-card',
    elevated: 'bg-white shadow-soft-lg border-0',
    outlined: 'bg-white border-2 border-stone-200 shadow-none',
    gradient: 'bg-gradient-card border border-stone-100/50 shadow-card',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div 
      className={`
        rounded-2xl overflow-hidden transition-all duration-200 
        ${variants[variant]}
        ${interactive ? 'card-interactive hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]' : ''} 
        ${className}
      `}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {(title || action) && (
        <div className="px-5 py-4 border-b border-stone-100/80 flex justify-between items-center">
          <div>
            {title && <h3 className="text-base font-bold text-stone-800">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={title || action ? paddings[padding] : paddings[padding]}>
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
  trendUp?: boolean;
  delay?: number;
  variant?: 'default' | 'rose' | 'gold';
}

export const SummaryCard: React.FC<SummaryCardProps> = memo(({ 
  label, 
  value, 
  icon, 
  trend, 
  trendUp,
  delay = 0,
  variant = 'default'
}) => {
  const iconBgColors = {
    default: 'bg-rose-50 text-rose-500',
    rose: 'bg-rose-100 text-rose-600',
    gold: 'bg-gold-100 text-gold-600',
  };

  return (
    <div 
      className="
        bg-white p-4 rounded-2xl shadow-card border border-stone-100/80 
        flex flex-col justify-between h-28 relative overflow-hidden 
        group hover:shadow-card-hover hover:-translate-y-0.5
        transition-all duration-300 touch-feedback active:scale-[0.98] gpu-accelerate
        stagger-item
      "
      style={{ animationDelay: `${delay}ms` }}
      role="region"
      aria-label={`${label}: ${value}${trend ? `, ${trend}` : ''}`}
    >
      <div className="flex justify-between items-start z-10">
        <p className="text-xs font-medium text-stone-500 tracking-wide">{label}</p>
        {icon && (
          <div className={`p-2 rounded-xl ${iconBgColors[variant]} group-hover:scale-110 transition-transform duration-300`} aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
      <div className="z-10">
        <h4 className="text-xl font-bold text-stone-900 tracking-tight">{value}</h4>
        {trend && (
          <p className={`text-[11px] mt-0.5 font-medium ${trendUp === true ? 'text-emerald-600' : trendUp === false ? 'text-red-500' : 'text-stone-400'}`}>
            {trend}
          </p>
        )}
      </div>
      {/* Decorative gradient */}
      <div 
        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-30 group-hover:scale-125 transition-transform duration-500" 
        style={{ background: 'radial-gradient(circle, rgba(232,76,114,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
    </div>
  );
});

SummaryCard.displayName = 'SummaryCard';
