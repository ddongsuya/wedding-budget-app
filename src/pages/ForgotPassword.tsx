import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">이메일을 확인하세요</h1>
          <p className="text-gray-600 mb-6">
            {email}로 비밀번호 재설정 안내를 보내드렸습니다.
            <br />
            이메일이 도착하지 않으면 스팸함을 확인해주세요.
          </p>
          <Link
            to="/login"
            className="block w-full py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-600 mb-6 hover:text-gray-800 transition-colors">
          <ArrowLeft size={20} />
          <span>로그인으로 돌아가기</span>
        </Link>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">비밀번호 찾기</h1>
        <p className="text-gray-600 mb-6">
          가입하신 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!email || isLoading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-colors ${
              email && !isLoading
                ? 'bg-rose-500 hover:bg-rose-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? '처리 중...' : '재설정 링크 받기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
