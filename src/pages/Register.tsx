import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Eye, EyeOff, Check, X, Shield, Heart, Sparkles, AlertTriangle } from 'lucide-react';

// 비밀번호 강도 검증
const validatePassword = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 5) strength = 'strong';
  else if (score >= 3) strength = 'medium';
  
  return { checks, score, strength, isValid: score >= 4 };
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 비밀번호 강도 계산
  const passwordValidation = useMemo(() => validatePassword(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDetails([]);

    if (password !== confirmPassword) {
      const errorMsg = '비밀번호가 일치하지 않습니다';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('비밀번호가 보안 요구사항을 충족하지 않습니다');
      const errors: string[] = [];
      if (!passwordValidation.checks.length) errors.push('8자 이상');
      if (!passwordValidation.checks.uppercase) errors.push('영문 대문자');
      if (!passwordValidation.checks.lowercase) errors.push('영문 소문자');
      if (!passwordValidation.checks.number) errors.push('숫자');
      if (!passwordValidation.checks.special) errors.push('특수문자');
      setErrorDetails(errors);
      toast.warning('비밀번호 보안 요구사항을 확인해주세요');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      toast.success('회원가입이 완료되었습니다! 🎉');
      navigate('/couple/connect');
    } catch (err: any) {
      const response = err.response?.data;
      const errorMessage = response?.error || '회원가입에 실패했습니다';
      setError(errorMessage);
      if (response?.details) {
        setErrorDetails(response.details);
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50 px-4 py-8 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-white/50 p-8">
          {/* 로고 영역 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-button mb-4">
              <Heart className="text-white" size={28} fill="white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-1">Needless Wedding</h1>
            <p className="text-stone-500 text-sm flex items-center justify-center gap-1">
              <Sparkles size={14} className="text-gold-500" />
              새 계정을 만들어보세요
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm" role="alert" aria-live="assertive">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-medium">{error}</p>
                  {errorDetails.length > 0 && (
                    <p className="text-xs mt-1 text-red-500">필요: {errorDetails.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1.5">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                autoCapitalize="words"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors touch-feedback"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              
              {/* 비밀번호 강도 표시 */}
              {password && (
                <div className="mt-3 p-3 bg-stone-50/50 rounded-xl space-y-2" role="status" aria-live="polite" aria-label="비밀번호 강도">
                  {/* 강도 바 */}
                  <div className="flex gap-1" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          passwordValidation.score >= level
                            ? passwordValidation.strength === 'strong'
                              ? 'bg-emerald-500'
                              : passwordValidation.strength === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                            : 'bg-stone-200'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* 강도 텍스트 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      passwordValidation.strength === 'strong' ? 'text-emerald-600' :
                      passwordValidation.strength === 'medium' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {passwordValidation.strength === 'strong' ? '강함' :
                       passwordValidation.strength === 'medium' ? '보통' : '약함'}
                    </span>
                    <div className="flex items-center gap-1 text-stone-500">
                      <Shield size={12} aria-hidden="true" />
                      <span>보안 수준</span>
                    </div>
                  </div>
                  
                  {/* 체크리스트 */}
                  <div className="grid grid-cols-2 gap-1.5 text-xs" role="list" aria-label="비밀번호 요구사항">
                    {[
                      { key: 'length', label: '8자 이상' },
                      { key: 'uppercase', label: '대문자' },
                      { key: 'lowercase', label: '소문자' },
                      { key: 'number', label: '숫자' },
                      { key: 'special', label: '특수문자' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1.5" role="listitem">
                        {passwordValidation.checks[key as keyof typeof passwordValidation.checks] ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check size={10} className="text-emerald-600" aria-hidden="true" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center">
                            <X size={10} className="text-stone-400" aria-hidden="true" />
                          </div>
                        )}
                        <span className={passwordValidation.checks[key as keyof typeof passwordValidation.checks] ? 'text-emerald-600' : 'text-stone-400'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-1.5">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`input-field pr-12 ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-500/20'
                      : confirmPassword && password === confirmPassword
                      ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-emerald-500/20'
                      : ''
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors touch-feedback"
                  aria-label={showConfirmPassword ? '비밀번호 확인 숨기기' : '비밀번호 확인 보기'}
                >
                  {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1" role="alert">
                  <X size={12} aria-hidden="true" /> 비밀번호가 일치하지 않습니다
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1" role="status">
                  <Check size={12} aria-hidden="true" /> 비밀번호가 일치합니다
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none touch-feedback active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  가입 중...
                </span>
              ) : '회원가입'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-stone-600 text-sm">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-rose-500 hover:text-rose-600 font-semibold transition-colors">
                로그인
              </Link>
            </p>
          </div>
        </div>
        
        {/* 하단 텍스트 */}
        <p className="text-center text-xs text-stone-400 mt-4">
          © 2024 Needless Wedding. All rights reserved.
        </p>
      </div>
    </div>
  );
}
