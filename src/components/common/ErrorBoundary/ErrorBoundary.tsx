import * as Sentry from '@sentry/react';
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Optional key to force remount children when changed */
  resetKey?: string | number;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 * 
 * Requirements: 10.1 - User-friendly error page for unhandled errors
 * 
 * Features:
 * - User-friendly Korean error messages
 * - Retry button with automatic state reset
 * - Refresh and Home navigation options
 * - Error details in development mode
 * - Sentry integration for error tracking
 * - Accessibility support with ARIA attributes
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, retryCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // Reset error state when resetKey changes
    if (props.resetKey !== undefined && state.hasError) {
      return { hasError: false, error: undefined, errorInfo: undefined };
    }
    return null;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Store error info for display
    this.setState({ errorInfo });
    
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    });
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo);
    
    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState((prevState) => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          retryCount={this.state.retryCount}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  onReset: () => void;
  retryCount?: number;
}

// 에러 폴백 UI
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset, retryCount = 0 }) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const handleRetry = async () => {
    setIsRetrying(true);
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    onReset();
    setIsRetrying(false);
  };

  const handleReportIssue = () => {
    // Create a mailto link with error details
    const subject = encodeURIComponent('웨딩 플래너 앱 오류 보고');
    const body = encodeURIComponent(
      `오류가 발생했습니다.\n\n` +
      `오류 메시지: ${error?.message || '알 수 없음'}\n` +
      `발생 시간: ${new Date().toLocaleString('ko-KR')}\n` +
      `브라우저: ${navigator.userAgent}\n\n` +
      `추가 설명:\n`
    );
    window.open(`mailto:support@needlesswedding.com?subject=${subject}&body=${body}`);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-stone-50 p-4"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="text-center max-w-md w-full animate-fade-in">
        {/* Error Icon with animation */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
          <AlertCircle size={40} className="text-red-500" aria-hidden="true" />
        </div>
        
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          앗, 문제가 발생했어요
        </h1>
        
        <p className="text-stone-500 mb-8 leading-relaxed">
          불편을 드려 죄송합니다.<br />
          잠시 후 다시 시도해주세요.
        </p>
        
        {/* Retry count indicator */}
        {retryCount > 0 && retryCount < 3 && (
          <p className="text-sm text-stone-400 mb-4">
            재시도 횟수: {retryCount}회
          </p>
        )}
        
        {/* Show additional help after multiple retries */}
        {retryCount >= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700">
              여러 번 시도해도 문제가 해결되지 않으면<br />
              페이지를 새로고침하거나 잠시 후 다시 방문해주세요.
            </p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          {/* 다시 시도 버튼 - Requirements 10.1 */}
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl font-medium hover:from-rose-500 hover:to-rose-600 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
            aria-label="다시 시도하기"
          >
            <RefreshCw size={18} className={isRetrying ? 'animate-spin' : ''} aria-hidden="true" />
            {isRetrying ? '재시도 중...' : '다시 시도'}
          </button>
          
          {/* 새로고침 버튼 */}
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            aria-label="페이지 새로고침"
          >
            <RefreshCw size={18} aria-hidden="true" />
            새로고침
          </button>
          
          {/* 홈으로 가기 버튼 */}
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            aria-label="홈으로 이동"
          >
            <Home size={18} aria-hidden="true" />
            홈으로
          </button>
        </div>
        
        {/* 문제 보고 버튼 */}
        <button
          onClick={handleReportIssue}
          className="text-sm text-stone-500 hover:text-stone-700 transition-colors flex items-center justify-center gap-1 mx-auto mb-6 focus:outline-none focus:underline"
          aria-label="문제 보고하기"
        >
          <MessageCircle size={14} aria-hidden="true" />
          문제 보고하기
        </button>
        
        {/* 개발 모드에서 에러 상세 정보 표시 */}
        {isDevelopment && error && (
          <div className="mt-6 text-left">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors mx-auto focus:outline-none focus:underline"
              aria-expanded={showDetails}
              aria-controls="error-details"
            >
              {showDetails ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
              {showDetails ? '에러 상세 숨기기' : '에러 상세 보기'}
            </button>
            
            {showDetails && (
              <div 
                id="error-details"
                className="mt-4 p-4 bg-stone-100 rounded-lg text-left overflow-auto max-h-64"
                role="region"
                aria-label="에러 상세 정보"
              >
                <p className="text-sm font-medium text-red-600 mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-stone-600 whitespace-pre-wrap break-words font-mono">
                    {error.stack}
                  </pre>
                )}
                {errorInfo?.componentStack && (
                  <>
                    <p className="text-sm font-medium text-stone-700 mt-4 mb-2">
                      Component Stack:
                    </p>
                    <pre className="text-xs text-stone-600 whitespace-pre-wrap break-words font-mono">
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        <p className="text-xs text-stone-400 mt-8">
          이 오류는 자동으로 보고되었습니다.
        </p>
      </div>
      
      {/* CSS for custom animation */}
      <style>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Sentry의 ErrorBoundary 래퍼 (더 간단한 방법)
export const SentryErrorBoundary = Sentry.withErrorBoundary;
