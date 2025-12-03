import * as Sentry from '@sentry/react';
import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Sentry에 에러 전송
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

// 에러 폴백 UI
const ErrorFallback = ({ onReset }: { onReset: () => void }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-fade-in">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-stone-800 mb-2">
          앗, 문제가 발생했어요
        </h1>
        
        <p className="text-stone-500 mb-8 leading-relaxed">
          불편을 드려 죄송합니다.<br />
          잠시 후 다시 시도해주세요.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl font-medium hover:from-rose-500 hover:to-rose-600 transition-all shadow-lg shadow-rose-200"
          >
            새로고침
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium hover:bg-stone-200 transition-all"
          >
            홈으로 가기
          </button>
        </div>
        
        <p className="text-xs text-stone-400 mt-8">
          이 오류는 자동으로 보고되었습니다.
        </p>
      </div>
    </div>
  );
};

// Sentry의 ErrorBoundary 래퍼 (더 간단한 방법)
export const SentryErrorBoundary = Sentry.withErrorBoundary;
