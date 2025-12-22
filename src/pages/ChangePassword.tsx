import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Check, X, ArrowLeft } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold">비밀번호 변경</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* 안내 문구 */}
        <div className="bg-rose-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-rose-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-800">안전한 비밀번호 설정</p>
              <p className="text-sm text-gray-600 mt-1">
                비밀번호는 8자 이상, 영문과 숫자를 모두 포함해야 합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 현재 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 ${
                errors.currentPassword ? 'border-red-400' : 'border-gray-200'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('current')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
          )}
        </div>

        {/* 새 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('new')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* 비밀번호 강도 체크 */}
          {formData.newPassword && (
            <div className="mt-3 space-y-2">
              <PasswordCheck 
                passed={passwordChecks.length} 
                text="8자 이상" 
              />
              <PasswordCheck 
                passed={passwordChecks.hasLetter} 
                text="영문 포함" 
              />
              <PasswordCheck 
                passed={passwordChecks.hasNumber} 
                text="숫자 포함" 
              />
            </div>
          )}
        </div>

        {/* 새 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            새 비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('confirm')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* 비밀번호 일치 여부 */}
          {formData.confirmPassword && (
            <div className="mt-2">
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
          className={`w-full py-4 rounded-xl font-semibold text-white transition-colors ${
            canSubmit && !isLoading
              ? 'bg-rose-500 hover:bg-rose-600'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? '변경 중...' : '비밀번호 변경하기'}
        </button>
      </form>
    </div>
  );
};

// 비밀번호 체크 아이콘 컴포넌트
const PasswordCheck = ({ passed, text }: { passed: boolean; text: string }) => (
  <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600' : 'text-gray-400'}`}>
    {passed ? (
      <Check size={16} className="text-green-500" />
    ) : (
      <X size={16} className="text-gray-300" />
    )}
    <span>{text}</span>
  </div>
);

export default ChangePassword;
