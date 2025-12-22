import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // 프로덕션 환경에서만 활성화 (DSN이 있을 때만)
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      // 환경 구분
      environment: import.meta.env.MODE,
      
      // 릴리즈 버전 (배포 시 자동 설정 권장)
      release: import.meta.env.VITE_APP_VERSION || '1.0.0',
      
      // 성능 모니터링 (선택)
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // 샘플링 비율
      tracesSampleRate: 0.1, // 10% 성능 추적
      replaysSessionSampleRate: 0.1, // 10% 세션 리플레이
      replaysOnErrorSampleRate: 1.0, // 에러 시 100% 리플레이
      
      // 민감 정보 필터링
      beforeSend(event) {
        // 비밀번호 등 민감 정보 제거
        if (event.request?.data) {
          const data = event.request.data;
          if (typeof data === 'string' && data.includes('password')) {
            event.request.data = '[FILTERED]';
          }
        }
        return event;
      },
      
      // 무시할 에러
      ignoreErrors: [
        // 네트워크 에러 (일시적)
        'Network Error',
        'Failed to fetch',
        'Load failed',
        // 브라우저 확장 프로그램 에러
        'chrome-extension://',
        'moz-extension://',
        // 취소된 요청
        'AbortError',
        'canceled',
      ],
    });
    
    // 초기 컨텍스트 설정 - Requirements 10.2, 10.5
    Sentry.setContext('app', {
      name: 'Needless Wedding',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: import.meta.env.MODE,
    });
    
    // 브라우저 정보 컨텍스트
    Sentry.setContext('browser', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    });
  }
};

// 사용자 정보 설정 (로그인 후 호출)
export const setSentryUser = (user: { id: string | number; email: string; name?: string }) => {
  Sentry.setUser({
    id: String(user.id),
    email: user.email,
    username: user.name,
  });
};

// 로그아웃 시 사용자 정보 제거
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// 커스텀 컨텍스트 추가
export const setSentryContext = (name: string, context: Record<string, any>) => {
  Sentry.setContext(name, context);
};

// 수동 에러 리포팅
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, {
    extra: context,
  });
};

// 수동 메시지 리포팅
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};
