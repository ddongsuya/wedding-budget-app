import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Needless Wedding</h1>
            <p className="text-gray-600">로그인하여 시작하세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert" aria-live="assertive">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent text-base"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-3 pr-12 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 touch-feedback"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-rose-500 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-feedback"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              계정이 없으신가요?{' '}
              <Link to="/register" className="text-rose-500 hover:text-rose-600 font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
