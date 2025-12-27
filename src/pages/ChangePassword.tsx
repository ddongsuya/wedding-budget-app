import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Check, X, ArrowLeft, Shield } from 'lucide-react';
import { authAPI } from '../api/auth';
import { useToastContext } from '../contexts/ToastContext';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 비밀번호 강도 체크
  const passwordChecks = {
    length: formData.newPassword.length >= 8,
    hasLetter: /[a-zA-Z]/.test(formData.newPassword),
    hasNumber: /[0-9]/.test(formData.newPassword),
    match: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== '',
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.hasLetter && passwordChecks.hasNumber;
  const canSubmit = formData.currentPassword && isPasswordValid && passwordChecks.match;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 에러 초기화
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      showToast('success', '비밀번호가 변경되었습니다');
      navigate('/settings');
    } catch (error: any) {
      const message = error.response?.data?.message || '비밀번호 변경에 실패했습니다';
      
      if (message.includes('현재 비밀번호')) {
        setErrors({ currentPassword: message });
      } else {
        showToast('error', message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 - Safe Area 적용 */}
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 safe-area-pt">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
          <h1 className="text-lg font-semibold text-stone-800">비밀번호 변경</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* 안내 문구 */}
        <div className="bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-2xl p-4 border border-rose-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock size={20} className="text-rose-500" />
            </div>
            <div>
              <p className="font-medium text-stone-800">안전한 비밀번호 설정</p>
              <p className="text-sm text-stone-600 mt-1">
                비밀번호는 8자 이상, 영문과 숫자를 모두 포함해야 합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 현재 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            현재 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className={`input-field pr-12 ${
                errors.currentPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('current')}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            >
              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
              <X size={14} /> {errors.currentPassword}
            </p>
          )}
        </div>

        {/* 새 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              className="input-field pr-12"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('new')}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            >
              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* 비밀번호 강도 체크 */}
          {formData.newPassword && (
            <div className="mt-3 p-3 bg-stone-50/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-stone-500 flex items-center gap-1">
                  <Shield size={12} />
                  보안 요구사항
                </span>
              </div>
              <div className="space-y-1.5">
                <PasswordCheck passed={passwordChecks.length} text="8자 이상" />
                <PasswordCheck passed={passwordChecks.hasLetter} text="영문 포함" />
                <PasswordCheck passed={passwordChecks.hasNumber} text="숫자 포함" />
              </div>
            </div>
          )}
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">
            새 비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              className={`input-field pr-12 ${
                formData.confirmPassword && !passwordChecks.match
                  ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-500/20'
                  : formData.confirmPassword && passwordChecks.match
                  ? 'border-emerald-300 bg-emerald-50/50 focus:border-emerald-400 focus:ring-emerald-500/20'
                  : ''
              }`}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('confirm')}
              className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            >
              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* 비밀번호 일치 여부 */}
          {formData.confirmPassword && (
            <div className="mt-1.5">
              <PasswordCheck 
                passed={passwordChecks.match} 
                text={passwordChecks.match ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'} 
              />
            </div>
          )}
        </div>

        {/* 변경 버튼 */}
        <button
          type="submit"
          disabled={!canSubmit || isLoading}
          className="w-full min-h-[48px] bg-gradient-to-r from-rose-500 to-rose-600 text-white py-3.5 rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none touch-feedback active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              변경 중...
            </span>
          ) : '비밀번호 변경하기'}
        </button>
      </form>
    </div>
  );
};

// 비밀번호 체크 아이콘 컴포넌트
const PasswordCheck = ({ passed, text }: { passed: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-sm ${passed ? 'text-emerald-600' : 'text-stone-400'}`}>
    {passed ? (
      <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check size={10} className="text-emerald-600" />
      </div>
    ) : (
      <div className="w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center">
        <X size={10} className="text-stone-400" />
      </div>
    )}
    <span>{text}</span>
  </div>
);

export default ChangePassword;
