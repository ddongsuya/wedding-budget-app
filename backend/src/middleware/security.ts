import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { CorsOptions } from 'cors';

// 허용된 Origin 목록 (환경변수에서 가져오거나 기본값 사용)
const getAllowedOrigins = (): string[] => {
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);
  return envOrigins || [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://wedding-budget-app.vercel.app',
    'https://wedding-budget-app-2.vercel.app',
  ];
};

// CORS 설정 강화
// Requirements 8.4: 허용된 origin만 접근 가능하도록 설정
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // 개발 환경에서는 origin이 없는 요청 허용 (Postman, curl 등)
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 프로덕션에서는 허용된 origin만 허용
    if (origin && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // 허용되지 않은 origin
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // 쿠키 전송 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: [
    'Content-Length',
    'X-Requested-With',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // Preflight 캐시 24시간
  optionsSuccessStatus: 200, // 일부 레거시 브라우저 호환성
};

// CORS origin 검증 유틸리티 함수
export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return process.env.NODE_ENV !== 'production';
  return getAllowedOrigins().includes(origin);
};

// Helmet 보안 헤더 설정
// Requirements 8.3: API 응답에 적절한 보안 헤더 설정
export const securityHeaders = helmet({
  // Content Security Policy 설정
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  // X-Frame-Options: DENY - 클릭재킹 방지
  frameguard: { action: 'deny' },
  // X-Content-Type-Options: nosniff - MIME 타입 스니핑 방지
  noSniff: true,
  // X-XSS-Protection: 1; mode=block - XSS 방지
  xssFilter: true,
  // Referrer-Policy 설정
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // HSTS 설정 (프로덕션에서만 활성화)
  hsts: process.env.NODE_ENV === 'production' 
    ? { maxAge: 31536000, includeSubDomains: true }
    : false,
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { allow: false },
  // X-Download-Options (IE 전용)
  ieNoOpen: true,
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  // Cross-Origin-Embedder-Policy 비활성화 (이미지 로딩 호환성)
  crossOriginEmbedderPolicy: false,
  // Cross-Origin-Opener-Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  // Cross-Origin-Resource-Policy
  crossOriginResourcePolicy: { policy: 'same-origin' },
});

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

// Base64 데이터인지 확인
const isBase64Data = (value: string): boolean => {
  // data:image/... 형식의 Base64 이미지 데이터 확인
  return value.startsWith('data:image/') || value.startsWith('data:application/');
};

// SQL Injection 검사에서 제외할 필드 목록
const SKIP_SQL_CHECK_FIELDS = [
  'image_url',
  'image',
  'photo',
  'groom_image',
  'bride_image',
  'couple_photo',
  'receipt_url',
  'thumbnail',
];

// 요청 본문 검증 미들웨어
export const validateRequestBody = (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  
  // 재귀적으로 모든 문자열 필드 검사
  const checkObject = (obj: any, parentKey: string = ''): boolean => {
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        // Base64 이미지 데이터나 특정 필드는 SQL Injection 검사 제외
        if (SKIP_SQL_CHECK_FIELDS.includes(key) || isBase64Data(value)) {
          continue;
        }
        if (containsSqlInjection(value)) {
          return false;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (!checkObject(value, key)) {
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
