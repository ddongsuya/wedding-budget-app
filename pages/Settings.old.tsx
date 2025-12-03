
import React, { useEffect, useState, useRef } from 'react';
import { StorageService } from '../services/storage';
import { CoupleProfile, AppSettings } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DatePicker } from '../components/ui/DatePicker';
import { User, Settings as SettingsIcon, Info, Database, Moon, Bell, Globe, DollarSign, Camera, Heart, Download, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { useToast } from '../src/hooks/useToast';
import { compressImage, formatFileSize } from '../src/utils/imageCompression';

type Tab = 'profile' | 'app' | 'info' | 'data';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<CoupleProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // File input refs
  const groomInputRef = useRef<HTMLInputElement>(null);
  const brideInputRef = useRef<HTMLInputElement>(null);
  const coupleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(StorageService.getCoupleProfile());
    setSettings(StorageService.getAppSettings());
  }, []);

  const handleProfileChange = (field: string, value: any, section?: 'groom' | 'bride') => {
    setProfile(prev => {
      if (!prev) return null;
      if (section) {
        return {
          ...prev,
          [section]: { ...prev[section], [field]: value }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSettingsChange = (field: keyof AppSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    StorageService.saveAppSettings(newSettings);
  };

  const saveProfile = () => {
    if (!profile) return;
    
    // 1. Validation
    if (!profile.groom.name.trim() || !profile.bride.name.trim()) {
       alert('신랑과 신부 이름을 모두 입력해주세요.');
       return;
    }

    try {
      console.log('Saving profile...', profile);

      // 2. Save to Storage
      StorageService.saveCoupleProfile(profile);
      
      // 3. Success Feedback
      toast.success('프로필이 저장되었습니다! 💕');
      
      // 4. Force Reload to update global UI (Header, Sidebar)
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('저장 중 오류가 발생했습니다. 이미지 용량이 너무 클 수 있습니다 (3MB 제한)');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'groom' | 'bride' | 'couple') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }

    try {
      // 원본 파일 크기 표시
      const originalSize = formatFileSize(file.size);
      console.log(`원본 이미지: ${originalSize}`);

      // 이미지 압축 (최대 2MB, 품질 80%)
      toast.info('이미지 압축 중...');
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.8,
        maxSizeMB: 2,
      });

      const compressedSize = formatFileSize(compressedFile.size);
      console.log(`압축 후: ${compressedSize}`);

      // 압축된 이미지를 base64로 변환
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'couple') {
          handleProfileChange('couplePhotoUrl', base64);
        } else {
          handleProfileChange('avatarUrl', base64, target);
        }
        toast.success(`이미지 업로드 완료 (${originalSize} → ${compressedSize})`);
      };
      reader.onerror = () => {
        toast.error('이미지 업로드에 실패했습니다');
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('이미지 처리 중 오류가 발생했습니다');
    }
  };

  const handleExport = () => {
    try {
      const data = StorageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wedding_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('데이터가 내보내기되었습니다');
    } catch (error) {
      toast.error('데이터 내보내기에 실패했습니다');
    }
  };

  const handleReset = () => {
    if (confirm('정말로 모든 데이터를 삭제하고 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        StorageService.clearAllData();
        toast.info('모든 데이터가 초기화되었습니다');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        toast.error('초기화에 실패했습니다');
      }
    }
  };

  const calculateDays = (targetDate: string, isFuture: boolean = true) => {
    if (!targetDate) return 0;
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(targetDate);
    target.setHours(0,0,0,0);
    const diff = target.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return isFuture ? days : Math.abs(days) + 1;
  };

  if (!profile || !settings) return <div>Loading...</div>;

  const dDay = calculateDays(profile.weddingDate);
  const dPlusDay = calculateDays(profile.meetingDate, false);

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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'profile' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <User size={18} /> 커플 프로필
        </button>
        <button 
          onClick={() => setActiveTab('app')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'app' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <SettingsIcon size={18} /> 앱 설정
        </button>
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'info' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <Info size={18} /> 도움말 & 정보
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === 'data' ? 'bg-white text-rose-500 border-b-2 border-rose-500' : 'text-stone-500 hover:text-stone-800'}`}
        >
          <Database size={18} /> 데이터 관리
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'profile' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Groom */}
                <Card title="신랑 프로필" className="h-full">
                  <div className="flex flex-col items-center mb-6">
                    <div 
                      className="w-28 h-28 rounded-full bg-stone-100 mb-3 overflow-hidden border-4 border-white shadow-md relative cursor-pointer group transition-transform hover:scale-105"
                      onClick={() => groomInputRef.current?.click()}
                    >
                      {profile.groom.avatarUrl ? (
                        <img src={profile.groom.avatarUrl} alt="Groom" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <User size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white mb-1" />
                        <span className="text-[10px] text-white">편집</span>
                      </div>
                    </div>
                    <input type="file" ref={groomInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'groom')} />
                    <p className="text-xs text-stone-400">1:1 비율 추천 (자동 중앙 정렬)</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500">이름 <span className="text-rose-500">*</span></label>
                      <input type="text" value={profile.groom.name} onChange={(e) => handleProfileChange('name', e.target.value, 'groom')} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500 text-sm" placeholder="이름 입력" />
                    </div>
                    <div className="space-y-1">
                      <DatePicker 
                        label="생년월일"
                        value={profile.groom.birthday} 
                        onChange={(date) => handleProfileChange('birthday', date, 'groom')} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500">연락처</label>
                      <input type="tel" value={profile.groom.contact} onChange={(e) => handleProfileChange('contact', e.target.value, 'groom')} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500 text-sm" placeholder="010-0000-0000" />
                    </div>
                  </div>
                </Card>

                {/* Bride */}
                <Card title="신부 프로필" className="h-full">
                  <div className="flex flex-col items-center mb-6">
                    <div 
                      className="w-28 h-28 rounded-full bg-stone-100 mb-3 overflow-hidden border-4 border-white shadow-md relative cursor-pointer group transition-transform hover:scale-105"
                      onClick={() => brideInputRef.current?.click()}
                    >
                      {profile.bride.avatarUrl ? (
                        <img src={profile.bride.avatarUrl} alt="Bride" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <User size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white mb-1" />
                        <span className="text-[10px] text-white">편집</span>
                      </div>
                    </div>
                    <input type="file" ref={brideInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'bride')} />
                    <p className="text-xs text-stone-400">1:1 비율 추천 (자동 중앙 정렬)</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500">이름 <span className="text-rose-500">*</span></label>
                      <input type="text" value={profile.bride.name} onChange={(e) => handleProfileChange('name', e.target.value, 'bride')} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500 text-sm" placeholder="이름 입력" />
                    </div>
                    <div className="space-y-1">
                      <DatePicker 
                        label="생년월일"
                        value={profile.bride.birthday} 
                        onChange={(date) => handleProfileChange('birthday', date, 'bride')} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-500">연락처</label>
                      <input type="tel" value={profile.bride.contact} onChange={(e) => handleProfileChange('contact', e.target.value, 'bride')} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500 text-sm" placeholder="010-0000-0000" />
                    </div>
                  </div>
                </Card>

                {/* Couple Info */}
                <Card title="커플 정보" className="md:col-span-2">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div 
                          className="w-full h-48 bg-stone-100 rounded-xl overflow-hidden relative group cursor-pointer border border-stone-200"
                          onClick={() => coupleInputRef.current?.click()}
                      >
                          {profile.couplePhotoUrl ? (
                            <img src={profile.couplePhotoUrl} alt="Couple" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                              <Heart size={48} className="mb-2 opacity-50"/>
                              <span className="text-sm">커플 대표 사진을 등록하세요</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={32} />
                          </div>
                      </div>
                      <input type="file" ref={coupleInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'couple')} />
                      <p className="text-xs text-stone-400 mt-2 text-center">대시보드 상단 배경으로 사용됩니다.</p>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-500">우리의 애칭/별명</label>
                          <input type="text" value={profile.nickname} onChange={(e) => handleProfileChange('nickname', e.target.value)} className="w-full px-3 py-2 border rounded-lg outline-none focus:border-rose-500 text-sm" placeholder="예: 알콩달콩 우리" />
                      </div>
                      <div className="space-y-1">
                          <DatePicker 
                            label="처음 만난 날"
                            value={profile.meetingDate} 
                            onChange={(date) => handleProfileChange('meetingDate', date)} 
                          />
                      </div>
                      <div className="space-y-1">
                          <DatePicker 
                            label="결혼 예정일"
                            value={profile.weddingDate} 
                            onChange={(date) => handleProfileChange('weddingDate', date)} 
                          />
                      </div>
                    </div>
                  </div>
                </Card>
             </div>

             {/* Previews */}
             <div className="mt-8 pt-8 border-t border-stone-200">
               <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                 <Camera size={20} className="text-rose-500"/> 프로필 미리보기
               </h3>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Sidebar Preview */}
                 <div className="space-y-2">
                   <p className="text-xs font-bold text-stone-400 text-center uppercase tracking-wider">사이드바 프로필</p>
                   <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center justify-center gap-3 w-64 mx-auto">
                      <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-full">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full border border-white bg-stone-200 overflow-hidden">
                              {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]"><User size={12}/></div>}
                            </div>
                            <div className="w-6 h-6 rounded-full border border-white bg-stone-200 overflow-hidden">
                              {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px]"><User size={12}/></div>}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-stone-600 truncate max-w-[100px]">{profile.nickname || '우리'}</span>
                      </div>
                      
                      <div className="bg-rose-50 p-4 rounded-xl relative overflow-hidden w-full text-center mt-2">
                          <div className="relative z-10">
                            <p className="text-xs text-rose-600 font-semibold mb-1 flex items-center justify-center gap-1">
                              <Heart size={10} className="fill-rose-600"/> Wedding Day
                            </p>
                            <p className="text-sm font-bold text-stone-800">{profile.weddingDate}</p>
                            <p className="text-2xl font-bold text-rose-500 mt-1">D-{dDay}</p>
                          </div>
                      </div>
                   </div>
                 </div>

                 {/* Dashboard Preview */}
                 <div className="lg:col-span-2 space-y-2">
                    <p className="text-xs font-bold text-stone-400 text-center uppercase tracking-wider">대시보드 상단</p>
                    <div className="relative rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm p-6">
                      <div className="flex items-center justify-between gap-6 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                <div className="w-14 h-14 rounded-full border-2 border-white shadow-md bg-stone-100 overflow-hidden">
                                  {profile.groom.avatarUrl ? <img src={profile.groom.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-300"><User size={24}/></div>}
                                </div>
                                <div className="w-14 h-14 rounded-full border-2 border-white shadow-md bg-stone-100 overflow-hidden z-10">
                                  {profile.bride.avatarUrl ? <img src={profile.bride.avatarUrl} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-stone-300"><User size={24}/></div>}
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                                  {profile.nickname || '우리 결혼해요'}
                                </h2>
                                <p className="text-stone-500 text-sm font-medium mt-0.5">
                                  {profile.groom.name} & {profile.bride.name}
                                </p>
                            </div>
                          </div>

                          <div className="flex gap-4 text-center bg-stone-50/80 backdrop-blur-sm p-3 rounded-xl">
                            <div>
                                <p className="text-[10px] text-stone-500 font-bold uppercase">만난 지</p>
                                <p className="text-lg font-bold text-rose-500">D+{dPlusDay}</p>
                            </div>
                            <div className="w-px bg-stone-200"></div>
                            <div>
                                <p className="text-[10px] text-stone-500 font-bold uppercase">결혼까지</p>
                                <p className="text-lg font-bold text-rose-500">D-{dDay}</p>
                            </div>
                          </div>
                      </div>
                      
                      {profile.couplePhotoUrl && (
                          <div className="absolute inset-0 z-0 opacity-10">
                            <img src={profile.couplePhotoUrl} alt="Back" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
                          </div>
                      )}
                    </div>
                 </div>

               </div>
             </div>

             <div className="flex justify-end pt-4 border-t border-stone-200">
                <Button onClick={saveProfile} size="lg" icon={<Check size={18} />}>프로필 저장하기</Button>
             </div>
          </div>
        )}

        {activeTab === 'app' && (
           <Card title="앱 설정">
             <div className="space-y-6">
                <div className="flex items-center justify-between p-2">
                   <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-600"><Moon size={20}/></div>
                      <div>
                        <p className="font-bold text-stone-800">다크 모드</p>
                        <p className="text-xs text-stone-500">어두운 테마를 사용합니다 (준비중)</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.darkMode} onChange={(e) => handleSettingsChange('darkMode', e.target.checked)} />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                   </label>
                </div>
                
                <div className="flex items-center justify-between p-2">
                   <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-600"><Bell size={20}/></div>
                      <div>
                        <p className="font-bold text-stone-800">알림 설정</p>
                        <p className="text-xs text-stone-500">주요 일정 및 D-day 알림을 받습니다</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.notifications} onChange={(e) => handleSettingsChange('notifications', e.target.checked)} />
                      <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                   </label>
                </div>

                <div className="flex items-center justify-between p-2">
                   <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-600"><DollarSign size={20}/></div>
                      <div>
                        <p className="font-bold text-stone-800">통화 단위</p>
                        <p className="text-xs text-stone-500">금액 표시 단위를 설정합니다</p>
                      </div>
                   </div>
                   <select 
                      value={settings.currency} 
                      onChange={(e) => handleSettingsChange('currency', e.target.value)}
                      className="bg-stone-50 border border-stone-200 text-stone-800 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2 outline-none"
                   >
                      <option value="KRW">KRW (원)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                   </select>
                </div>

                <div className="flex items-center justify-between p-2">
                   <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-600"><Globe size={20}/></div>
                      <div>
                        <p className="font-bold text-stone-800">언어 설정</p>
                        <p className="text-xs text-stone-500">앱 내 표시 언어를 변경합니다</p>
                      </div>
                   </div>
                   <select 
                      value={settings.language} 
                      onChange={(e) => handleSettingsChange('language', e.target.value)}
                      className="bg-stone-50 border border-stone-200 text-stone-800 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2 outline-none"
                   >
                      <option value="ko">한국어</option>
                      <option value="en">English</option>
                   </select>
                </div>
             </div>
           </Card>
        )}

        {activeTab === 'info' && (
           <div className="space-y-6">
              <Card title="공지사항">
                 <div className="space-y-3">
                    <div className="p-3 bg-stone-50 rounded-xl">
                       <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded mb-1">New</span>
                       <h4 className="font-bold text-stone-800 text-sm">웨딩 플래너 앱 런칭!</h4>
                       <p className="text-xs text-stone-500 mt-1">
                          결혼 준비의 모든 것을 한번에 관리하세요. 예산부터 식장 비교까지 스마트하게 도와드립니다.
                       </p>
                    </div>
                    <div className="p-3 bg-stone-50 rounded-xl opacity-60">
                       <span className="inline-block px-2 py-0.5 bg-stone-200 text-stone-600 text-[10px] font-bold rounded mb-1">Update</span>
                       <h4 className="font-bold text-stone-800 text-sm">v1.0.1 마이너 업데이트</h4>
                       <p className="text-xs text-stone-500 mt-1">
                          프로필 이미지 업로드 기능이 개선되었습니다.
                       </p>
                    </div>
                 </div>
              </Card>

              <Card title="앱 사용 가이드">
                 <div className="space-y-4">
                    {[
                       { q: '식장 비교는 어떻게 하나요?', a: '식장 메뉴에서 "추가" 버튼을 눌러 정보를 입력하고, 목록에서 2개 이상 선택하면 하단에 "비교하기" 버튼이 나타납니다. 최대 4개까지 동시에 비교할 수 있습니다.' },
                       { q: '예산 설정은 어디서 하나요?', a: '예산 메뉴 상단의 "설정" 버튼을 통해 총 예산과 분담 비율을 설정할 수 있습니다. 각 카테고리별 예산도 자유롭게 추가/수정 가능합니다.' },
                       { q: '데이터는 어디에 저장되나요?', a: '모든 데이터는 현재 사용 중인 기기의 브라우저(LocalStorage)에 안전하게 저장됩니다. 서버로 전송되지 않아 프라이버시가 보장됩니다.' },
                       { q: '기기를 변경하면 데이터는 어떻게 되나요?', a: '기본적으로 데이터는 연동되지 않습니다. "데이터 관리" 탭에서 백업 파일을 다운로드한 후, 새 기기에서 데이터를 가져올 수 있습니다.' }
                    ].map((item, idx) => (
                       <details key={idx} className="group bg-stone-50 rounded-xl p-4 cursor-pointer open:bg-rose-50 transition-colors">
                          <summary className="font-bold text-stone-800 flex justify-between items-center list-none select-none">
                             {item.q}
                             <ChevronDown size={16} className="text-stone-400 group-open:rotate-180 transition-transform group-open:text-rose-500"/>
                          </summary>
                          <p className="text-sm text-stone-600 mt-3 pl-2 border-l-2 border-rose-200 animate-fade-in leading-relaxed">{item.a}</p>
                       </details>
                    ))}
                 </div>
              </Card>

              <Card title="정보">
                 <div className="space-y-4 text-sm text-stone-600">
                    <div className="flex justify-between py-2 border-b border-stone-100">
                       <span>현재 버전</span>
                       <span className="font-bold text-stone-800">v1.0.0</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-stone-100">
                       <span>개발자</span>
                       <span className="font-bold text-stone-800">Wedding Planner Team</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-stone-100">
                       <span>문의하기</span>
                       <a href="mailto:support@weddingplanner.com" className="text-rose-500 font-bold hover:underline">support@weddingplanner.com</a>
                    </div>
                 </div>
              </Card>
           </div>
        )}

        {activeTab === 'data' && (
           <Card title="데이터 관리">
              <div className="space-y-6">
                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                    <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                       <Download size={18}/> 데이터 내보내기 (백업)
                    </h4>
                    <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                       현재 저장된 모든 데이터(예산, 식장, 지출, 설정 등)를 JSON 파일로 다운로드합니다.
                       다른 기기로 데이터를 옮기거나 혹시 모를 상황에 대비해 백업해두세요.
                    </p>
                    <Button onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-blue-200">
                       데이터 다운로드
                    </Button>
                 </div>

                 <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                    <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                       <RotateCcw size={18}/> 데이터 초기화
                    </h4>
                    <p className="text-sm text-red-700 mb-4 leading-relaxed">
                       앱에 저장된 모든 데이터를 영구적으로 삭제하고 초기 상태로 되돌립니다.
                       이 작업은 복구할 수 없으니 신중하게 결정해주세요.
                    </p>
                    <Button onClick={handleReset} variant="danger">
                       모든 데이터 삭제
                    </Button>
                 </div>
              </div>
           </Card>
        )}
      </div>
    </div>
  );
};

export default Settings;
