import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Copy, Check, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { coupleAPI, CoupleInfo, PartnerInfo } from '../api/couple';
import { useToastContext } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const CoupleConnect = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { refreshUser } = useAuth();

  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadCoupleInfo();
  }, []);

  const loadCoupleInfo = async () => {
    try {
      setIsLoading(true);
      const response = await coupleAPI.getCoupleInfo();

      if (response.data.data) {
        setCoupleInfo(response.data.data.couple);
        setPartner(response.data.data.partner);
        setIsConnected(response.data.data.isConnected);
      }
    } catch (error) {
      console.error('Failed to load couple info');
    } finally {
      setIsLoading(false);
    }
  };

  // 커플 생성 (초대 코드 발급)
  const handleCreateCouple = async () => {
    try {
      setIsCreating(true);
      const response = await coupleAPI.createCouple();

      setCoupleInfo(response.data.data.couple);
      showToast('success', '초대 코드가 생성되었습니다!');

      // 사용자 정보 새로고침 (couple_id 업데이트)
      await refreshUser?.();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || '커플 생성에 실패했습니다');
    } finally {
      setIsCreating(false);
    }
  };

  // 초대 코드로 연결
  const handleJoinCouple = async () => {
    if (!inviteCodeInput.trim()) {
      showToast('error', '초대 코드를 입력해주세요');
      return;
    }

    try {
      setIsJoining(true);
      const response = await coupleAPI.joinCouple(inviteCodeInput.trim());

      setCoupleInfo(response.data.data.couple);
      setPartner(response.data.data.partner);
      setIsConnected(true);

      showToast('success', '커플 연결이 완료되었습니다! 💕');

      // 사용자 정보 새로고침
      await refreshUser?.();

      // 대시보드로 이동
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      showToast('error', error.response?.data?.message || '연결에 실패했습니다');
    } finally {
      setIsJoining(false);
    }
  };

  // 초대 코드 복사
  const handleCopyCode = async () => {
    if (!coupleInfo?.invite_code) return;

    try {
      await navigator.clipboard.writeText(coupleInfo.invite_code);
      setIsCopied(true);
      showToast('success', '초대 코드가 복사되었습니다!');

      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      showToast('error', '복사에 실패했습니다');
    }
  };

  // 초대 코드 재생성
  const handleRegenerateCode = async () => {
    try {
      const response = await coupleAPI.regenerateInviteCode();
      setCoupleInfo(prev => prev ? { ...prev, invite_code: response.data.data.inviteCode } : null);
      showToast('success', '새 초대 코드가 생성되었습니다');
    } catch (error) {
      showToast('error', '코드 재생성에 실패했습니다');
    }
  };

  // 카카오톡 공유
  const handleShareKakao = () => {
    const message = `💕 우리 결혼 준비 함께해요!\n\n초대 코드: ${coupleInfo?.invite_code}\n\n앱에서 이 코드를 입력하면 함께 결혼 준비를 할 수 있어요!`;

    // 카카오톡 공유 또는 기본 공유
    if (navigator.share) {
      navigator.share({
        title: '결혼 준비 초대',
        text: message,
      });
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(message);
      showToast('success', '공유 메시지가 복사되었습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  // 이미 커플 연결된 경우
  if (isConnected && partner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4">
        <div className="max-w-md mx-auto pt-12">
          {/* 연결 완료 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={40} className="text-green-500 fill-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">커플 연결 완료!</h1>
            <p className="text-gray-600">이제 함께 결혼 준비를 할 수 있어요 💕</p>
          </div>

          {/* 파트너 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-rose-400" />
              내 파트너
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-300 to-rose-400 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {partner.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-800">{partner.name}</p>
                <p className="text-sm text-gray-500">{partner.email}</p>
              </div>
            </div>
          </div>

          {/* 대시보드로 이동 */}
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
          >
            결혼 준비 시작하기
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // 커플 생성됨 (파트너 대기 중)
  if (coupleInfo && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4">
        <div className="max-w-md mx-auto pt-12">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={40} className="text-rose-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">파트너를 초대하세요</h1>
            <p className="text-gray-600">아래 초대 코드를 파트너에게 공유해주세요</p>
          </div>

          {/* 초대 코드 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <p className="text-sm text-gray-500 text-center mb-3">내 초대 코드</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl font-bold tracking-widest text-rose-500">
                {coupleInfo.invite_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                {isCopied ? (
                  <Check size={24} className="text-green-500" />
                ) : (
                  <Copy size={24} className="text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
              >
                코드 복사하기
              </button>
              <button
                onClick={handleShareKakao}
                className="flex-1 py-3 bg-yellow-400 text-yellow-900 rounded-xl font-medium hover:bg-yellow-500 transition-colors"
              >
                공유하기
              </button>
            </div>

            <button
              onClick={handleRegenerateCode}
              className="w-full mt-3 py-2 text-gray-500 text-sm flex items-center justify-center gap-1 hover:text-gray-700"
            >
              <RefreshCw size={14} />
              새 코드 생성
            </button>
          </div>

          {/* 또는 코드 입력 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-sm text-gray-500 text-center mb-3">또는 파트너의 코드 입력</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="초대 코드 입력"
                maxLength={6}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                onClick={handleJoinCouple}
                disabled={isJoining || inviteCodeInput.length < 6}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
              >
                {isJoining ? '...' : '연결'}
              </button>
            </div>
          </div>

          {/* 나중에 하기 */}
          <button
            onClick={() => navigate('/')}
            className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700"
          >
            나중에 연결하기
          </button>
        </div>
      </div>
    );
  }

  // 커플 없음 (처음)
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4">
      <div className="max-w-md mx-auto pt-12">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={40} className="text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">함께 준비해요</h1>
          <p className="text-gray-600">파트너와 연결하여 결혼 준비를 함께 해보세요</p>
        </div>

        {/* 초대 코드 생성 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">초대 코드 만들기</h2>
          <p className="text-sm text-gray-500 mb-4">
            초대 코드를 만들고 파트너에게 공유하세요
          </p>
          <button
            onClick={handleCreateCouple}
            disabled={isCreating}
            className="w-full py-4 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 disabled:bg-gray-300 transition-colors"
          >
            {isCreating ? '생성 중...' : '초대 코드 만들기'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">또는</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* 초대 코드 입력 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="font-semibold text-gray-800 mb-2">초대 코드 입력</h2>
          <p className="text-sm text-gray-500 mb-4">
            파트너에게 받은 초대 코드를 입력하세요
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="예: ABC123"
              maxLength={6}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              onClick={handleJoinCouple}
              disabled={isJoining || inviteCodeInput.length < 6}
              className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 disabled:bg-gray-300 transition-colors"
            >
              {isJoining ? '...' : '연결'}
            </button>
          </div>
        </div>

        {/* 나중에 하기 */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 py-3 text-gray-500 hover:text-gray-700"
        >
          혼자 시작하기 (나중에 연결)
        </button>
      </div>
    </div>
  );
};

export default CoupleConnect;
