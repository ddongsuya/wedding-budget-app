import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Requirements 8.5: 일반 API Rate Limiting - 분당 100회 제한
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 100, // 분당 100 요청
  message: {
    success: false,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true, // RateLimit-* 헤더 포함
  legacyHeaders: true, // X-RateLimit-* 헤더 포함
  keyGenerator: (req: Request) => {
    // IP 기반 rate limiting
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  skip: (req: Request) => {
    // 헬스체크 엔드포인트는 제외
    return req.path === '/health';
  },
});

// Requirements 7.4: 로그인 API Rate Limiting - 15분당 5회 제한
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 5, // 15분당 5회
  message: {
    success: false,
    message: '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
    code: 'TOO_MANY_LOGIN_ATTEMPTS',
  },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: Request) => {
    // IP + 이메일 조합으로 rate limiting
    const email = req.body?.email?.toLowerCase() || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `${ip}:${email}`;
  },
  skipFailedRequests: false, // 실패한 요청도 카운트
  skipSuccessfulRequests: true, // 성공한 요청은 카운트하지 않음
});

// 비밀번호 재설정 Rate Limiting - 1시간당 3회
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 3, // 1시간당 3회
  message: {
    success: false,
    message: '비밀번호 재설정 요청이 너무 많습니다. 1시간 후 다시 시도해주세요.',
    code: 'TOO_MANY_RESET_ATTEMPTS',
  },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: Request) => {
    const email = req.body?.email?.toLowerCase() || '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `reset:${ip}:${email}`;
  },
});

// 회원가입 Rate Limiting - 1시간당 5회
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 5, // 1시간당 5회
  message: {
    success: false,
    message: '회원가입 시도가 너무 많습니다. 1시간 후 다시 시도해주세요.',
    code: 'TOO_MANY_REGISTER_ATTEMPTS',
  },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});

// 엄격한 Rate Limiting (민감한 작업용) - 분당 10회
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 분당 10회
  message: {
    success: false,
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: true,
});

// 메모리 기반 로그인 실패 추적 (추가 보안 레이어)
const loginAttempts = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15분
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30분 차단

// 로그인 실패 기록
export const recordLoginFailure = (ip: string, email: string): { blocked: boolean; remainingAttempts: number } => {
  const key = `${ip}:${email.toLowerCase()}`;
  const now = Date.now();
  
  let attempt = loginAttempts.get(key);
  
  if (!attempt || now - attempt.firstAttempt > WINDOW_MS) {
    attempt = { count: 1, firstAttempt: now };
  } else {
    attempt.count++;
  }
  
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(key, attempt);
    return { blocked: true, remainingAttempts: 0 };
  }
  
  loginAttempts.set(key, attempt);
  return { blocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count };
};

// 로그인 성공 시 기록 초기화
export const clearLoginAttempts = (ip: string, email: string) => {
  const key = `${ip}:${email.toLowerCase()}`;
  loginAttempts.delete(key);
};

// 차단 상태 확인 미들웨어
export const checkLoginBlock = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = req.body?.email?.toLowerCase() || '';
  const key = `${ip}:${email}`;
  
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  
  if (attempt?.blockedUntil && now < attempt.blockedUntil) {
    const remainingMinutes = Math.ceil((attempt.blockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      message: `너무 많은 로그인 시도가 있었습니다. ${remainingMinutes}분 후에 다시 시도해주세요.`,
      code: 'ACCOUNT_TEMPORARILY_LOCKED',
      retryAfter: remainingMinutes,
    });
  }
  
  next();
};

// 주기적으로 만료된 항목 정리 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.blockedUntil && now > attempt.blockedUntil) {
      loginAttempts.delete(key);
    } else if (now - attempt.firstAttempt > WINDOW_MS * 2) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5분마다 정리
