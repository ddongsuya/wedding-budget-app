import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings as SettingsIcon, Info, Database, Moon, Bell, Globe, DollarSign, Camera, Heart, Check, Users, Lock, Megaphone, Shield } from 'lucide-react';
import { useToastContext } from '../src/contexts/ToastContext';
import { coupleAPI } from '../src/api/couple';
import { useAuth } from '../src/contexts/AuthContext';

type Tab = 'profile' | 'app' | 'account' | 'info';

interface CoupleProfile {
  groom_name: string;
  groom_birth_date: string;
  groom_contact: string;
  groom_image: string | null;
  bride_name: string;
  bride_birth_date: string;
  bride_contact: string;
  bride_image: string | null;
  first_met_date: string;
  wedding_date: string;
  couple_nickname: string;
  couple_photo: string | null;
}

const SettingsNew: React.FC = () => {
  const { showToast } = useToastContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 앱 설정 (LocalStorage - 개인 설정)
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [currency, setCurrency] = useState('KRW');
  const [language, setLanguage] = useState('ko');

  useEffect(() => {
    loadProfile();
    loadAppSettings();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await coupleAPI.getProfile();
      if (response.data.profile) {
        setProfile(response.data.profile);
      } else {
        // 프로필이 없으면 초기값 설정
        setProfile({
          groom_name: '',
          groom_birth_date: '',
          groom_contact: '',
          groom_image: null,
          bride_name: '',
          bride_birth_date: '',
          bride_contact: '',
          bride_image: null,
          first_met_date: '',
          wedding_date: '',
          couple_nickname: '',
          couple_photo: null,
        });
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      // 401 에러는 인증 문제이므로 다른 메시지 표시
      if (error.response?.status === 401) {
        showToast('error', '로그인이 필요합니다. 다시 로그인해주세요.');
      } else {
        // 프로필 로드 실패해도 기본값으로 설정
        setProfile({
          groom_name: '',
          groom_birth_date: '',
          groom_contact: '',
          groom_image: null,
          bride_name: '',
          bride_birth_date: '',
          bride_contact: '',
          bride_image: null,
          first_met_date: '',
          wedding_date: '',
          couple_nickname: '',
          couple_photo: null,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadAppSettings = () => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setDarkMode(settings.darkMode || false);
      setNotifications(settings.notifications !== false);
      setCurrency(settings.currency || 'KRW');
      setLanguage(settings.language || 'ko');
    }
  };

  const saveAppSettings = (key: string, value: any) => {
    const settings = {
      darkMode,
      notifications,
      currency,
      language,
      [key]: value,
    };
    localStorage.setItem('appSettings', JSON.stringify(settings));
  };

  const handleProfileChange = (field: keyof CoupleProfile, value: any) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };

  const saveProfile = async () => {
    if (!profile) return;

    if (!profile.groom_name.trim() || !profile.bride_name.trim()) {
      showToast('error', '신랑과 신부 이름을 모두 입력해주세요');
      return;
    }

    try {
      setIsSaving(true);
      await coupleAPI.updateProfile(profile);
      showToast('success', '프로필이 저장되었습니다! 💕');
    } catch (error) {
      console.error('Save profile error:', error);
      showToast('error', '프로필 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'groom' | 'bride' | 'couple') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', '이미지 파일만 업로드 가능합니다');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', '이미지 크기는 10MB 이하여야 합니다');
      return;
    }

    try {
      showToast('info', '이미지 업로드 중...');
      const formData = new FormData();
      formData.append('image', file);

      let response;
      if (target === 'groom') {
        response = await coupleAPI.uploadGroomImage(formData);
      } else if (target === 'bride') {
        response = await coupleAPI.uploadBrideImage(formData);
      } else {
        response = await coupleAPI.uploadCoupleImage(formData);
      }

      // 프로필 다시 로드
      await loadProfile();
      showToast('success', '이미지가 업로드되었습니다');
    } catch (error) {
      console.error('Image upload error:', error);
      showToast('error', '이미지 업로드에 실패했습니다');
    }
  };

  const calculateDays = (targetDate: string, isFuture: boolean = true) => {
    if (!targetDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return isFuture ? days : Math.abs(days) + 1;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const dDay = calculateDays(profile.wedding_date);
  const dPlusDay = calculateDays(profile.first_met_date, false);

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-800">환경 설정</h2>
          <p className="text-sm text-stone-500">프로필 및 앱 환경을 설정합니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-stone-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'profile' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <User size={18} /> 커플 프로필
        </button>
        <button
          onClick={() => setActiveTab('app')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'app' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <SettingsIcon size={18} /> 앱 설정
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'account' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Lock size={18} /> 계정
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'info' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Info size={18} /> 정보
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* 프로필 이미지 섹션 */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                <Camera size={20} className="text-rose-500" />
                프로필 사진
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 신랑 사진 */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    {profile.groom_image ? (
                      <img
                        src={profile.groom_image}
                        alt="신랑"
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User size={48} className="text-blue-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors shadow-lg">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'groom')}
                      />
                    </label>
                  </div>
                  <p className="text-sm font-medium text-gray-700">신랑 사진</p>
                </div>

                {/* 커플 사진 */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    {profile.couple_photo ? (
                      <img
                        src={profile.couple_photo}
                        alt="커플"
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-rose-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <Heart size={48} className="text-rose-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors shadow-lg">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'couple')}
                      />
                    </label>
                  </div>
                  <p className="text-sm font-medium text-gray-700">커플 사진</p>
                </div>

                {/* 신부 사진 */}
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-3">
                    {profile.bride_image ? (
                      <img
                        src={profile.bride_image}
                        alt="신부"
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-pink-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <User size={48} className="text-pink-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors shadow-lg">
                      <Camera size={16} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'bride')}
                      />
                    </label>
                  </div>
                  <p className="text-sm font-medium text-gray-700">신부 사진</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                사진을 클릭하여 업로드하세요 (최대 10MB)
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">신랑 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.groom_name}
                    onChange={(e) => handleProfileChange('groom_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="이름 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                  <input
                    type="date"
                    value={profile.groom_birth_date}
                    onChange={(e) => handleProfileChange('groom_birth_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                  <input
                    type="tel"
                    value={profile.groom_contact}
                    onChange={(e) => handleProfileChange('groom_contact', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">신부 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profile.bride_name}
                    onChange={(e) => handleProfileChange('bride_name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="이름 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                  <input
                    type="date"
                    value={profile.bride_birth_date}
                    onChange={(e) => handleProfileChange('bride_birth_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">연락처</label>
                  <input
                    type="tel"
                    value={profile.bride_contact}
                    onChange={(e) => handleProfileChange('bride_contact', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">커플 정보</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우리의 애칭/별명</label>
                  <input
                    type="text"
                    value={profile.couple_nickname}
                    onChange={(e) => handleProfileChange('couple_nickname', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                    placeholder="예: 알콩달콩 우리"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">처음 만난 날</label>
                  <input
                    type="date"
                    value={profile.first_met_date}
                    onChange={(e) => handleProfileChange('first_met_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">결혼 예정일</label>
                  <input
                    type="date"
                    value={profile.wedding_date}
                    onChange={(e) => handleProfileChange('wedding_date', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveProfile}
                disabled={isSaving}
                className="px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
              >
                {isSaving ? '저장 중...' : (
                  <>
                    <Check size={18} />
                    프로필 저장하기
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'app' && (
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                  <Moon size={20} />
                </div>
                <div>
                  <p className="font-bold text-stone-800">다크 모드</p>
                  <p className="text-xs text-stone-500">어두운 테마를 사용합니다 (준비중)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={darkMode}
                  onChange={(e) => {
                    setDarkMode(e.target.checked);
                    saveAppSettings('darkMode', e.target.checked);
                  }}
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="font-bold text-stone-800">알림 설정</p>
                  <p className="text-xs text-stone-500">주요 일정 및 D-day 알림을 받습니다</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications}
                  onChange={(e) => {
                    setNotifications(e.target.checked);
                    saveAppSettings('notifications', e.target.checked);
                  }}
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="font-bold text-stone-800">통화 단위</p>
                  <p className="text-xs text-stone-500">금액 표시 단위를 설정합니다</p>
                </div>
              </div>
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  saveAppSettings('currency', e.target.value);
                }}
                className="bg-stone-50 border border-stone-200 text-stone-800 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2 outline-none"
              >
                <option value="KRW">KRW (원)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                  <Globe size={20} />
                </div>
                <div>
                  <p className="font-bold text-stone-800">언어 설정</p>
                  <p className="text-xs text-stone-500">앱 내 표시 언어를 변경합니다</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  saveAppSettings('language', e.target.value);
                }}
                className="bg-stone-50 border border-stone-200 text-stone-800 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2 outline-none"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">계정 정보</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-medium text-gray-800">{user?.email}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">이름</span>
                  <span className="font-medium text-gray-800">{user?.name}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">보안</h3>
              <button
                onClick={() => navigate('/settings/password')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={20} className="text-gray-600" />
                  <span className="text-gray-800">비밀번호 변경</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">커플 관리</h3>
              <button
                onClick={() => navigate('/couple/connect')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users size={20} className="text-gray-600" />
                  <span className="text-gray-800">커플 연결 관리</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">알림</h3>
              <button
                onClick={() => navigate('/notifications')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-blue-500" />
                  <span className="text-gray-800">알림 센터</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/notifications/settings')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-gray-500" />
                  <span className="text-gray-800">알림 설정</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
              <button
                onClick={() => navigate('/announcements')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Megaphone size={20} className="text-rose-500" />
                  <span className="text-gray-800">공지사항 보기</span>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>

            {user?.is_admin && (
              <div className="bg-rose-50 rounded-xl p-6 shadow-sm border border-rose-100">
                <h3 className="text-lg font-bold text-rose-600 mb-4">관리자</h3>
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between p-4 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={20} className="text-rose-600" />
                    <span className="text-rose-700 font-medium">관리자 대시보드</span>
                  </div>
                  <span className="text-rose-400">→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-4">앱 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-600">버전</span>
                <span className="font-medium text-gray-800">v1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-gray-600">개발자</span>
                <span className="font-medium text-gray-800">Needless Wedding Team</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">문의하기</span>
                <a href="mailto:support@needlesswedding.com" className="text-rose-500 font-medium hover:underline">
                  support@needlesswedding.com
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsNew;
