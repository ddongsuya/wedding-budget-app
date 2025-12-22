import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { EmptyStateIllustration } from './EmptyStateIllustration';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  illustration?: 'wedding' | 'budget' | 'expense' | 'venue' | 'checklist' | 'calendar' | 'photo' | 'notification';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      {/* 일러스트레이션 또는 아이콘 */}
      <div className="mb-6 animate-fade-in" aria-hidden="true">
        {illustration ? (
          <EmptyStateIllustration type={illustration} />
        ) : Icon ? (
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
            {typeof Icon === 'function' ? <Icon size={40} className="text-stone-400" /> : Icon}
          </div>
        ) : null}
      </div>

      {/* 타이틀 */}
      <h3 className="text-lg font-bold text-stone-800 mb-2">
        {title}
      </h3>

      {/* 설명 */}
      {description && (
        <p className="text-stone-500 text-sm mb-6 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl font-medium hover:from-rose-500 hover:to-rose-600 transition-all shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 transform hover:scale-105"
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        )}
        
        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-all"
            aria-label={secondaryActionLabel}
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
