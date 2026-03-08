import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Copy, Check, Users, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
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

  const handleCreateCouple = async () => {
    try {
      setIsCreating(true);
      const response = await coupleAPI.createCouple();
      setCoupleInfo(response.data.data.couple);
      showToast('success', '초대 코드가 생성되었습니다!');
      await refreshUser?.();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || '커플 생성에 실패했습니다');
    } finally {
      setIsCreating(false);
    }
  };

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
      await refreshUser?.();
      setTimeout(() => navigate('/'), 1500);
    } catch (error: any) {
      showToast('error', error.response?.data?.message || '연결에 실패했습니다');
    } finally {
      setIsJoining(false);
    }
  };

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

  const handleRegenerateCode = async () => {
    try {
      const response = await coupleAPI.regenerateInviteCode();
      setCoupleInfo(prev => prev ? { ...prev, invite_code: response.data.data.inviteCode } : null);
      showToast('success', '새 초대 코드가 생성되었습니다');
    } catch (error) {
      showToast('error', '코드 재생성에 실패했습니다');
    }
  };

  const handleShareKakao = () => {
    const message = `💕 우리 결혼 준비 함께해요!\n\n초대 코드: ${coupleInfo?.invite_code}\n\n앱에서 이 코드를 입력하면 함께 결혼 준비를 할 수 있어요!`;
    if (navigator.share) {
      navigator.share({ title: '결혼 준비 초대', text: message });
    } else {
      navigator.clipboard.writeText(message);
      showToast('success', '공유 메시지가 복사되었습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  if (isConnected && partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50 p-4 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
        <div className="max-w-md mx-auto pt-12 relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Heart size={36} className="text-white fill-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">커플 연결 완료!</h1>
            <p className="text-stone-600 flex items-center justify-center gap-1">
              <Sparkles size={16} className="text-gold-500" />
              이제 함께 결혼 준비를 할 수 있어요 💕
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft-xl border border-white/50 mb-6">
            <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-rose-400" />
              내 파트너
            </h2>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center text-white text-xl font-semibold shadow-button">
                {partner.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-stone-800">{partner.name}</p>
                <p className="text-sm text-stone-500">{partner.email}</p>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold shadow-button hover:shadow-button-hover transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
            결혼 준비 시작하기
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (coupleInfo && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50 p-4 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
        <div className="max-w-md mx-auto pt-12 relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-button">
              <Heart size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">파트너를 초대하세요</h1>
            <p className="text-stone-600">아래 초대 코드를 파트너에게 공유해주세요</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft-xl border border-white/50 mb-6">
            <p className="text-sm text-stone-500 text-center mb-3">내 초대 코드</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-3xl font-bold tracking-widest text-gradient">{coupleInfo.invite_code}</span>
              <button onClick={handleCopyCode} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                {isCopied ? <Check size={24} className="text-emerald-500" /> : <Copy size={24} className="text-stone-400" />}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopyCode} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-medium shadow-button hover:shadow-button-hover transition-all">코드 복사하기</button>
              <button onClick={handleShareKakao} className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 rounded-xl font-medium shadow-sm hover:shadow-md transition-all">공유하기</button>
            </div>
            <button onClick={handleRegenerateCode} className="w-full mt-3 py-2 text-stone-500 text-sm flex items-center justify-center gap-1 hover:text-stone-700 transition-colors">
              <RefreshCw size={14} />
              새 코드 생성
            </button>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft-xl border border-white/50">
            <p className="text-sm text-stone-500 text-center mb-3">또는 파트너의 코드 입력</p>
            <div className="flex gap-2">
              <input type="text" value={inviteCodeInput} onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())} placeholder="초대 코드 입력" maxLength={6} className="flex-1 px-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all" />
              <button onClick={handleJoinCouple} disabled={isJoining || inviteCodeInput.length < 6} className="px-6 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors">{isJoining ? '...' : '연결'}</button>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-full mt-6 py-3 text-stone-500 hover:text-stone-700 transition-colors">나중에 연결하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-gold-50 p-4 relative overflow-hidden">
      <div className="absolute top-20 left-10 w-32 h-32 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gold-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl" />
      <div className="max-w-md mx-auto pt-12 relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-button">
            <Heart size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">함께 준비해요</h1>
          <p className="text-stone-600 flex items-center justify-center gap-1">
            <Sparkles size={14} className="text-gold-500" />
            파트너와 연결하여 결혼 준비를 함께 해보세요
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft-xl border border-white/50 mb-4">
          <h2 className="font-semibold text-stone-800 mb-2">초대 코드 만들기</h2>
          <p className="text-sm text-stone-500 mb-4">초대 코드를 만들고 파트너에게 공유하세요</p>
          <button onClick={handleCreateCouple} disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-semibold shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]">
            {isCreating ? '생성 중...' : '초대 코드 만들기'}
          </button>
        </div>
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-stone-400 text-sm">또는</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-soft-xl border border-white/50">
          <h2 className="font-semibold text-stone-800 mb-2">초대 코드 입력</h2>
          <p className="text-sm text-stone-500 mb-4">파트너에게 받은 초대 코드를 입력하세요</p>
          <div className="flex gap-2">
            <input type="text" value={inviteCodeInput} onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())} placeholder="예: ABC123" maxLength={6} className="flex-1 px-4 py-3 bg-stone-50/50 border border-stone-200 rounded-xl text-center text-lg tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all" />
            <button onClick={handleJoinCouple} disabled={isJoining || inviteCodeInput.length < 6} className="px-6 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-900 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors">{isJoining ? '...' : '연결'}</button>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="w-full mt-6 py-3 text-stone-500 hover:text-stone-700 transition-colors">혼자 시작하기 (나중에 연결)</button>
      </div>
    </div>
  );
};

export default CoupleConnect;
