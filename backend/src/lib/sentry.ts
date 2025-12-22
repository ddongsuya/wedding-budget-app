import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import os from 'os';

export const initSentry = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
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
            if (data.currentPassword) data.currentPassword = '[FILTERED]';
            if (data.confirmPassword) data.confirmPassword = '[FILTERED]';
            
            event.request.data = data;
          } catch (e) {
            // JSON 파싱 실패 시 무시
          }
        }
        
        // 헤더에서 민감 정보 제거
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        
        return event;
      },
    });
    
    // 서버 컨텍스트 설정 - Requirements 10.2, 10.5
    Sentry.setContext('server', {
      name: 'Needless Wedding API',
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
    });
    
    console.log('Sentry initialized for production environment');
  }
};

// Express 에러 핸들러
export const sentryErrorHandler = () => {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // 요청 컨텍스트 추가
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    
    // 사용자 정보 추가 (인증된 경우)
    if ((req as any).user) {
      Sentry.setUser({
        id: String((req as any).user.id),
        email: (req as any).user.email,
      });
    }
    
    Sentry.captureException(err);
    next(err);
  };
};

// 수동 에러 캡처
export const captureError = (error: Error, context?: Record<string, any>) => {
  Sentry.captureException(error, { extra: context });
};

// 수동 메시지 캡처
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// 사용자 컨텍스트 설정
export const setSentryUser = (user: { id: string | number; email: string }) => {
  Sentry.setUser({
    id: String(user.id),
    email: user.email,
  });
};

// 사용자 컨텍스트 제거
export const clearSentryUser = () => {
  Sentry.setUser(null);
};
