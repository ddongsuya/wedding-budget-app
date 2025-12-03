import * as Sentry from '@sentry/node';

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.APP_VERSION || '1.0.0',
      
      // 성능 모니터링
      tracesSampleRate: 0.1,
      
      // 민감 정보 필터링
      beforeSend(event) {
        // 비밀번호 필터링
        if (event.request?.data) {
          try {
            const data = typeof event.request.data === 'string'
              ? JSON.parse(event.request.data)
              : event.request.data;
            
            if (data.password) data.password = '[FILTERED]';
            if (data.newPassword) data.newPassword = '[FILTERED]';
            
            event.request.data = data;
          } catch (e) {
            // JSON 파싱 실패 시 무시
          }
        }
        return event;
      },
    });
  }
};

// Express 에러 핸들러
export const sentryErrorHandler = () => {
  return (err: Error, req: any, res: any, next: any) => {
    Sentry.captureException(err);
    next(err);
  };
};

// 수동 에러 캡처
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, { extra: context });
};
