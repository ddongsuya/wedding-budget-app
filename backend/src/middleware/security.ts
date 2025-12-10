import { Request, Response, NextFunction } from 'express';

// 보안 헤더 미들웨어
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // XSS 방지
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 클릭재킹 방지
  res.setHeader('X-Frame-Options', 'DENY');
  
  // MIME 타입 스니핑 방지
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer 정책
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 권한 정책
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS (HTTPS 강제) - 프로덕션에서만
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// 입력 검증 유틸리티
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // JavaScript 프로토콜 제거
    .replace(/on\w+=/gi, '') // 이벤트 핸들러 제거
    .trim();
};

// 이메일 검증
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// 비밀번호 강도 검증
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];
  let score = 0;
  
  // 최소 길이
  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다');
  } else {
    score++;
    if (password.length >= 12) score++;
  }
  
  // 영문 대문자
  if (!/[A-Z]/.test(password)) {
    errors.push('영문 대문자를 포함해야 합니다');
  } else {
    score++;
  }
  
  // 영문 소문자
  if (!/[a-z]/.test(password)) {
    errors.push('영문 소문자를 포함해야 합니다');
  } else {
    score++;
  }
  
  // 숫자
  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다');
  } else {
    score++;
  }
  
  // 특수문자
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다');
  } else {
    score++;
  }
  
  // 연속된 문자 체크
  if (/(.)\1{2,}/.test(password)) {
    errors.push('같은 문자를 3번 이상 연속 사용할 수 없습니다');
  }
  
  // 일반적인 패턴 체크
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('너무 흔한 비밀번호 패턴입니다');
  }
  
  // 강도 계산
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
};

// SQL Injection 방지 (기본적인 체크)
export const containsSqlInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b).*=/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

// 요청 본문 검증 미들웨어
export const validateRequestBody = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  
  // 재귀적으로 모든 문자열 필드 검사
  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        if (containsSqlInjection(value)) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (!checkObject(value)) {
          return false;
        }
      }
    }
    return true;
  };
  
  if (!checkObject(body)) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: '유효하지 않은 입력입니다',
    });
  }
  
  next();
};
