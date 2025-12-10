import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Eye, EyeOff, Check, X, Shield } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Needless Wedding</h1>
            <p className="text-gray-600">새 계정을 만들어보세요</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              <p className="font-medium">{error}</p>
              {errorDetails.length > 0 && (
                <p className="text-xs mt-1">필요: {errorDetails.join(', ')}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* 비밀번호 강도 표시 */}
              {password && (
                <div className="mt-2 space-y-2">
                  {/* 강도 바 */}
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordValidation.score >= level
                            ? passwordValidation.strength === 'strong'
                              ? 'bg-green-500'
                              : passwordValidation.strength === 'medium'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* 강도 텍스트 */}
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${
                      passwordValidation.strength === 'strong' ? 'text-green-600' :
                      passwordValidation.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {passwordValidation.strength === 'strong' ? '강함' :
                       passwordValidation.strength === 'medium' ? '보통' : '약함'}
                    </span>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Shield size={12} />
                      <span>보안 수준</span>
                    </div>
                  </div>
                  
                  {/* 체크리스트 */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      { key: 'length', label: '8자 이상' },
                      { key: 'uppercase', label: '대문자' },
                      { key: 'lowercase', label: '소문자' },
                      { key: 'number', label: '숫자' },
                      { key: 'special', label: '특수문자' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1">
                        {passwordValidation.checks[key as keyof typeof passwordValidation.checks] ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <X size={12} className="text-gray-300" />
                        )}
                        <span className={passwordValidation.checks[key as keyof typeof passwordValidation.checks] ? 'text-green-600' : 'text-gray-400'}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <Check size={12} /> 비밀번호가 일치합니다
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 rounded-lg font-medium hover:from-rose-500 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-rose-500 hover:text-rose-600 font-medium">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
