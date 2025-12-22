import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

/**
 * Error State Component
 * Displays an error message with optional retry functionality
 * 
 * Requirements: 10.1 - User-friendly error UI with retry option
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '문제가 발생했어요',
  message = '잠시 후 다시 시도해주세요',
  onRetry,
  showHomeButton = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 animate-fade-in">
        <AlertCircle size={40} className="text-red-400" />
      </div>
      
      <h3 className="text-lg font-bold text-stone-800 mb-2">
        {title}
      </h3>
      
      <p className="text-stone-500 text-sm mb-6">
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl font-medium hover:from-rose-500 hover:to-rose-600 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            다시 시도
          </button>
        )}
        
        {showHomeButton && (
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
            홈으로
          </button>
        )}
      </div>
    </div>
  );
};
