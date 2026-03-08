import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Eye, EyeOff, AlertTriangle, Heart, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ remainingAttempts?: number; retryAfter?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 세션 만료 시 안내 메시지 (Requirements 12.3)
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      toast.error('세션이 만료되었습니다. 다시 로그인해주세요.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorDetails(null);
    setLoading(true);

    try {
      await login(email, password);
      toast.success('로그인되었습니다! 💕');
      navigate('/');
    } catch (err: any) {
      const response = err.response?.data;
      const errorCode = response?.error;
      
      // 계정 잠금 처리
      if (errorCode === 'ACCOUNT_LOCKED' || err.response?.status === 423) {
        setError(response?.message || '계정이 일시적으로 잠겼습니다');
        setErrorDetails({ retryAfter: response?.retryAfter });
      } 
      // 너무 많은 시도
      else if (errorCode === 'TOO_MANY_ATTEMPTS' || err.response?.status === 429) {
        setError(response?.message || '너무 많은 로그인 시도가 있었습니다');
        setErrorDetails({ retryAfter: response?.retryAfter });
      }
      // 일반 로그인 실패
      else {
        const errorMessage = response?.error || '로그인에 실패했습니다';
        setError(errorMessage);
        if (response?.remainingAttempts !== undefined) {
          setErrorDetails({ remainingAttempts: response.remainingAttempts });
        }
      }
      
      toast.error(error || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50 px-4 relative overflow-hidden safe-area-inset">
      {/* 배경 장식 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-white/50 p-8">
          {/* 로고 영역 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-button mb-4">
              <Heart className="text-white" size={28} fill="white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-1">Needless Wedding</h1>
            <p className="text-stone-500 text-sm flex items-center justify-center gap-1">
              <Sparkles size={14} className="text-gold-500" />
              우리만의 웨딩 플래너
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm" role="alert" aria-live="assertive">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p>{error}</p>
                  {errorDetails?.remainingAttempts !== undefined && (
                    <p className="text-xs mt-1 text-red-500">
                      남은 시도 횟수: {errorDetails.remainingAttempts}회
                    </p>
                  )}
                  {errorDetails?.retryAfter && (
                    <p className="text-xs mt-1 text-red-500">
                      {errorDetails.retryAfter}분 후에 다시 시도해주세요
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
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
                  autoComplete="current-password"
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
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-stone-500 hover:text-rose-500 transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-stone-600 text-sm">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-rose-500 hover:text-rose-600 font-semibold transition-colors">
                회원가입
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
