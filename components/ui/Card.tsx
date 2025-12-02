import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden ${className}`}>
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
};

export const SummaryCard: React.FC<{ label: string; value: string; icon?: React.ReactNode; trend?: string }> = ({ label, value, icon, trend }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start z-10">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      {icon && <div className="text-rose-500 p-2 bg-rose-50 rounded-lg">{icon}</div>}
    </div>
    <div className="z-10">
      <h4 className="text-2xl font-bold text-stone-900 tracking-tight">{value}</h4>
      {trend && <p className="text-xs text-stone-400 mt-1">{trend}</p>}
    </div>
    {/* Decorative circle */}
    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gradient-to-br from-rose-50 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
  </div>
);
