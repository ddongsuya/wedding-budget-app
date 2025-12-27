import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useToastContext } from '../contexts/ToastContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { showToast } = useToastContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;

    setIsLoading(true);
    
    try {
      await authAPI.forgotPassword(email);
      setIsSent(true);
    } catch (error) {
      showToast('error', '요청 처리에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50 px-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
        
        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-white/50 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">이메일을 확인하세요</h1>
            <p className="text-stone-600 mb-6 text-sm">
              <span className="font-medium text-rose-500">{email}</span>로 비밀번호 재설정 안내를 보내드렸습니다.
              <br />
              이메일이 도착하지 않으면 스팸함을 확인해주세요.
            </p>
            <Link
              to="/login"
              className="block w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all"
            >
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-gold-50 px-4 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-soft-xl border border-white/50 p-8">
          <Link to="/login" className="inline-flex items-center gap-2 text-stone-500 mb-6 hover:text-stone-700 transition-colors text-sm">
            <ArrowLeft size={18} />
            <span>로그인으로 돌아가기</span>
          </Link>

          {/* 로고 영역 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-button mb-3">
              <Heart className="text-white" size={24} fill="white" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-1">비밀번호 찾기</h1>
            <p className="text-stone-500 text-sm">
              가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!email || isLoading}
              className="w-full min-h-[48px] bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3 rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none touch-feedback active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  처리 중...
                </span>
              ) : '재설정 링크 받기'}
            </button>
          </form>
        </div>
        
        {/* 하단 텍스트 */}
        <p className="text-center text-xs text-stone-400 mt-4">
          © 2024 Needless Wedding. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
