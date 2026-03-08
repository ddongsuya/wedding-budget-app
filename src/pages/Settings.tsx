import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings as SettingsIcon, Info, Moon, Bell, Globe, DollarSign, Camera, Heart, Check, Users, Lock, Megaphone, Shield, Download, Upload, Trash2, Unlink } from 'lucide-react';
import { useToastContext } from '@/contexts/ToastContext';
import { coupleAPI } from '@/api/couple';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCoupleSync } from '@/hooks/useCoupleSync';
import { backupAPI } from '@/api/backup';
import { authAPI } from '@/api/auth';
import DatePicker from '@/components/common/DatePicker/DatePicker';
import { compressImage } from '@/utils/imageCompression';
import { SettingsSkeleton } from '@/components/skeleton/SettingsSkeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';

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
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected: coupleConnected, partnerName: couplePartnerName } = useCoupleSync();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const originalWeddingDateRef = useRef<string>('');

  // 백업/복원 상태
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 계정 삭제 상태
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // 커플 연결 해제 상태
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // 앱 설정 (LocalStorage - 개인 설정)
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
        originalWeddingDateRef.current = response.data.profile.wedding_date || '';
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
      setNotifications(settings.notifications !== false);
      setCurrency(settings.currency || 'KRW');
      setLanguage(settings.language || 'ko');
    }
  };

  const saveAppSettings = (key: string, value: any) => {
    const settings = {
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
      // 프로필 변경 이벤트 발생 - 다른 컴포넌트들이 새 데이터를 가져오도록
      window.dispatchEvent(new CustomEvent('profile-updated'));
      // 결혼 예정일이 변경된 경우 별도 이벤트 발생
      if (originalWeddingDateRef.current !== profile.wedding_date) {
        window.dispatchEvent(new CustomEvent('wedding-date-changed', {
          detail: { weddingDate: profile.wedding_date }
        }));
        originalWeddingDateRef.current = profile.wedding_date;
      }
      showToast('success', '프로필이 저장되었습니다! 💕');
    } catch (error) {
      console.error('Save profile error:', error);
      showToast('error', '프로필 저장에 실패했습니다', { onRetry: saveProfile });
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

    try {
      showToast('info', '이미지 압축 중...');
      
      // 이미지 압축 (최대 1MB, 1200px)
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxSizeMB: 1,
      });
      
      console.log(`원본: ${(file.size / 1024 / 1024).toFixed(2)}MB → 압축: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      showToast('info', '이미지 업로드 중...');
      const formData = new FormData();
      formData.append('image', compressedFile);

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
      showToast('error', '이미지 업로드에 실패했습니다', { 
        onRetry: () => {
          // 파일 선택 다이얼로그 다시 열기
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => handleImageUpload(e as any, target);
          input.click();
        }
      });
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

  // 데이터 백업 (내보내기)
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await backupAPI.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wedding-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', '데이터가 성공적으로 내보내기되었습니다');
    } catch (error) {
      console.error('Export error:', error);
      showToast('error', '데이터 내보내기에 실패했습니다');
    } finally {
      setIsExporting(false);
    }
  };

  // 데이터 복원 (가져오기)
  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      const text = await file.text();
      const data = JSON.parse(text);
      await backupAPI.importData(data);
      showToast('success', '데이터가 성공적으로 복원되었습니다');
      // 프로필 다시 로드
      await loadProfile();
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error) {
      console.error('Import error:', error);
      showToast('error', '데이터 복원에 실패했습니다. 올바른 백업 파일인지 확인해주세요.');
    } finally {
      setIsImporting(false);
      // 파일 입력 초기화
      e.target.value = '';
    }
  };

  // 계정 삭제 - 1단계 확인 후 2단계 비밀번호 입력
  const handleDeleteStep1Confirm = () => {
    setShowDeleteConfirm(false);
    setShowPasswordConfirm(true);
    setDeletePassword('');
  };

  // 계정 삭제 - 2단계 비밀번호 확인 후 삭제
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      showToast('error', '비밀번호를 입력해주세요');
      return;
    }

    try {
      setIsDeleting(true);
      await authAPI.deleteAccount(deletePassword);
      showToast('success', '계정이 삭제되었습니다. 이용해주셔서 감사합니다.');
      setShowPasswordConfirm(false);
      logout();
      navigate('/login');
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error.response?.status === 401) {
        showToast('error', '비밀번호가 올바르지 않습니다');
      } else {
        showToast('error', '계정 삭제에 실패했습니다');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  // 커플 연결 해제 핸들러
  const handleDisconnectCouple = async () => {
    try {
      setIsDisconnecting(true);
      await coupleAPI.leaveCouple();
      showToast('success', '커플 연결이 해제되었습니다. 기존 데이터는 보존됩니다.');
      setShowDisconnectConfirm(false);
      window.dispatchEvent(new CustomEvent('profile-updated'));
    } catch (error: any) {
      console.error('Disconnect couple error:', error);
      showToast('error', error.response?.data?.message || '커플 연결 해제에 실패했습니다');
    } finally {
      setIsDisconnecting(false);
    }
  };

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
          <div className="space-y-4">
            {/* 프로필 이미지 섹션 - 컴팩트하게 */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-center gap-4 md:gap-8">
                {/* 신랑 사진 */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 md:w-24 md:h-24">
                    {profile.groom_image ? (
                      <img src={profile.groom_image} alt="신랑" className="w-full h-full rounded-full object-cover border-3 border-white shadow-md" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center border-3 border-white shadow-md">
                        <User size={32} className="text-blue-400" />
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-rose-600 transition-colors shadow">
                      <Camera size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'groom')} />
                    </label>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-1">신랑</p>
                </div>

                {/* 커플 사진 */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 md:w-28 md:h-28">
                    {profile.couple_photo ? (
                      <img src={profile.couple_photo} alt="커플" className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-rose-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <Heart size={36} className="text-rose-400" />
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-rose-600 transition-colors shadow">
                      <Camera size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'couple')} />
                    </label>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-1">커플</p>
                </div>

                {/* 신부 사진 */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 md:w-24 md:h-24">
                    {profile.bride_image ? (
                      <img src={profile.bride_image} alt="신부" className="w-full h-full rounded-full object-cover border-3 border-white shadow-md" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-pink-100 flex items-center justify-center border-3 border-white shadow-md">
                        <User size={32} className="text-pink-400" />
                      </div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-rose-600 transition-colors shadow">
                      <Camera size={12} />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'bride')} />
                    </label>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-1">신부</p>
                </div>
              </div>
            </div>

            {/* 신랑/신부 정보 - 2열 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 신랑 정보 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-base font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={14} className="text-blue-500" />
                  </div>
                  신랑 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">이름 *</label>
                    <input type="text" name="groom_name" autoComplete="name" value={profile.groom_name} onChange={(e) => handleProfileChange('groom_name', e.target.value)} className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="이름" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label>
                    <DatePicker value={profile.groom_birth_date} onChange={(date) => handleProfileChange('groom_birth_date', date)} placeholder="생년월일" minYear={1950} maxYear={new Date().getFullYear()} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                    <input type="tel" name="groom_contact" inputMode="tel" value={profile.groom_contact} onChange={(e) => handleProfileChange('groom_contact', e.target.value)} className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="010-0000-0000" />
                  </div>
                </div>
              </div>

              {/* 신부 정보 */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="text-base font-bold text-stone-800 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                    <User size={14} className="text-pink-500" />
                  </div>
                  신부 정보
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">이름 *</label>
                    <input type="text" name="bride_name" autoComplete="name" value={profile.bride_name} onChange={(e) => handleProfileChange('bride_name', e.target.value)} className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="이름" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">생년월일</label>
                    <DatePicker value={profile.bride_birth_date} onChange={(date) => handleProfileChange('bride_birth_date', date)} placeholder="생년월일" minYear={1950} maxYear={new Date().getFullYear()} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                    <input type="tel" name="bride_contact" inputMode="tel" value={profile.bride_contact} onChange={(e) => handleProfileChange('bride_contact', e.target.value)} className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="010-0000-0000" />
                  </div>
                </div>
              </div>
            </div>

            {/* 커플 정보 - 컴팩트 */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-base font-bold text-stone-800 mb-3 flex items-center gap-2">
                <Heart size={16} className="text-rose-500" />
                커플 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">우리의 애칭</label>
                  <input type="text" name="couple_nickname" value={profile.couple_nickname} onChange={(e) => handleProfileChange('couple_nickname', e.target.value)} className="w-full px-3 py-2 min-h-[44px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200 text-sm" placeholder="예: 알콩달콩" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">처음 만난 날</label>
                  <DatePicker value={profile.first_met_date} onChange={(date) => handleProfileChange('first_met_date', date)} placeholder="날짜 선택" minYear={2000} maxYear={new Date().getFullYear()} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">결혼 예정일</label>
                  <DatePicker value={profile.wedding_date} onChange={(date) => handleProfileChange('wedding_date', date)} placeholder="날짜 선택" minYear={new Date().getFullYear()} maxYear={new Date().getFullYear() + 5} />
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={isSaving} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 disabled:bg-gray-300 transition-colors flex items-center gap-2 text-sm">
                {isSaving ? '저장 중...' : (<><Check size={16} /> 저장하기</>)}
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
                  <p className="text-xs text-stone-500">어두운 테마를 사용합니다</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={theme === 'dark'}
                  onChange={() => toggleTheme()}
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
              <h3 className="text-lg font-bold text-stone-800 mb-4">데이터 관리</h3>
              <div className="space-y-2">
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Download size={20} className="text-blue-500" />
                    <div className="text-left">
                      <span className="text-gray-800 block">데이터 백업 (내보내기)</span>
                      <span className="text-xs text-gray-500">전체 데이터를 JSON 파일로 저장합니다</span>
                    </div>
                  </div>
                  {isExporting ? (
                    <span className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                  ) : (
                    <span className="text-gray-400">→</span>
                  )}
                </button>
                <label className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Upload size={20} className="text-green-500" />
                    <div className="text-left">
                      <span className="text-gray-800 block">데이터 복원 (가져오기)</span>
                      <span className="text-xs text-gray-500">백업 파일에서 데이터를 복원합니다</span>
                    </div>
                  </div>
                  {isImporting ? (
                    <span className="w-5 h-5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                  ) : (
                    <span className="text-gray-400">→</span>
                  )}
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportData}
                    disabled={isImporting}
                  />
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4">커플 관리</h3>
              {/* 커플 연결 상태 뱃지 */}
              <div className="flex items-center justify-between p-4 mb-2 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users size={20} className={coupleConnected ? 'text-emerald-500' : 'text-stone-400'} />
                  <div>
                    <span className="text-gray-800 block font-medium">커플 연결 상태</span>
                    {coupleConnected ? (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        연결됨{couplePartnerName ? `: ${couplePartnerName}` : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">미연결</span>
                    )}
                  </div>
                </div>
              </div>
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
              {coupleConnected && (
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-colors mt-1"
                >
                  <div className="flex items-center gap-3">
                    <Unlink size={20} className="text-red-400" />
                    <span className="text-red-600">커플 연결 해제</span>
                  </div>
                  <span className="text-red-300">→</span>
                </button>
              )}
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

            {/* 계정 삭제 (위험 영역) */}
            <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100">
              <h3 className="text-lg font-bold text-red-600 mb-2">위험 영역</h3>
              <p className="text-sm text-red-500 mb-4">계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.</p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                <Trash2 size={18} />
                계정 삭제 (회원 탈퇴)
              </button>
            </div>

            {/* 1단계: 삭제 확인 다이얼로그 */}
            <ConfirmDialog
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={handleDeleteStep1Confirm}
              title="정말 탈퇴하시겠습니까?"
              message="계정을 삭제하면 모든 데이터(예산, 지출, 체크리스트, 일정, 사진 등)가 영구적으로 삭제되며 복구할 수 없습니다."
              confirmLabel="탈퇴 진행"
              cancelLabel="취소"
              variant="danger"
            />

            {/* 2단계: 비밀번호 재입력 모달 */}
            {showPasswordConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowPasswordConfirm(false)} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-stone-800 mb-2">비밀번호 확인</h3>
                    <p className="text-sm text-stone-500 mb-4">본인 확인을 위해 비밀번호를 입력해주세요.</p>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="비밀번호 입력"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleDeleteAccount();
                      }}
                    />
                  </div>
                  <div className="flex gap-3 p-4 bg-stone-50 border-t border-stone-100">
                    <button
                      onClick={() => setShowPasswordConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword.trim()}
                      className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          삭제 중...
                        </>
                      ) : (
                        '계정 삭제'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 커플 연결 해제 확인 다이얼로그 */}
            <ConfirmDialog
              isOpen={showDisconnectConfirm}
              onClose={() => setShowDisconnectConfirm(false)}
              onConfirm={handleDisconnectCouple}
              title="커플 연결을 해제하시겠습니까?"
              message="연결을 해제해도 기존 데이터(예산, 지출, 체크리스트 등)는 보존됩니다. 파트너와의 실시간 동기화만 중단됩니다."
              confirmLabel="연결 해제"
              cancelLabel="취소"
              variant="warning"
              isLoading={isDisconnecting}
            />
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
                <a href="mailto:gathering@csco.co.kr" className="text-rose-500 font-medium hover:underline">
                  gathering@csco.co.kr
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
