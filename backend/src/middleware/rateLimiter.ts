import { Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';

// 메모리 기반 Rate Limiter (간단한 구현)
const loginAttempts = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();

// 설정
const MAX_LOGIN_ATTEMPTS = 5; // 최대 로그인 시도 횟수
const WINDOW_MS = 15 * 60 * 1000; // 15분 윈도우
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30분 차단

// IP 기반 Rate Limiter
export const loginRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const email = req.body.email?.toLowerCase() || '';
  const key = `${ip}:${email}`;
  
  const now = Date.now();
  const attempt = loginAttempts.get(key);
  
  // 차단 상태 확인
  if (attempt?.blockedUntil && now < attempt.blockedUntil) {
    const remainingMinutes = Math.ceil((attempt.blockedUntil - now) / 60000);
    return res.status(429).json({
      error: 'TOO_MANY_ATTEMPTS',
      message: `너무 많은 로그인 시도가 있었습니다. ${remainingMinutes}분 후에 다시 시도해주세요.`,
      retryAfter: remainingMinutes,
    });
  }
  
  // 윈도우 초과 시 리셋
  if (attempt && now - attempt.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
  }
  
  next();
};

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
  
  // 최대 시도 횟수 초과 시 차단
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

// API Rate Limiter (일반 요청용)
const apiRequests = new Map<string, { count: number; resetTime: number }>();
const API_RATE_LIMIT = 100; // 분당 100회
const API_WINDOW_MS = 60 * 1000; // 1분

export const apiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  let request = apiRequests.get(ip);
  
  if (!request || now > request.resetTime) {
    request = { count: 1, resetTime: now + API_WINDOW_MS };
  } else {
    request.count++;
  }
  
  apiRequests.set(ip, request);
  
  // 헤더에 Rate Limit 정보 추가
  res.setHeader('X-RateLimit-Limit', API_RATE_LIMIT);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, API_RATE_LIMIT - request.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil(request.resetTime / 1000));
  
  if (request.count > API_RATE_LIMIT) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
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
  
  for (const [key, request] of apiRequests.entries()) {
    if (now > request.resetTime + API_WINDOW_MS) {
      apiRequests.delete(key);
    }
  }
}, 5 * 60 * 1000); // 5분마다 정리
