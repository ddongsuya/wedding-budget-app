import { Link } from 'react-router-dom';
import { Lock, ChevronRight, User, Bell, LogOut, ArrowLeft, Shield, Heart, Receipt, FileText, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SettingsMenu = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  // 모바일에서 하단 탭에 없는 메뉴들
  const quickMenuItems = [
    {
      icon: Receipt,
      label: '지출 관리',
      path: '/expenses',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '지출 내역 확인 및 관리',
    },
    {
      icon: FileText,
      label: '체크리스트',
      path: '/checklist',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '결혼 준비 체크리스트',
    },
    {
      icon: Camera,
      label: '포토 레퍼런스',
      path: '/photo-references',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '웨딩 사진 아이디어 모음',
    },
  ];

  const menuItems = [
    {
      icon: User,
      label: '프로필 설정',
      path: '/settings',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Lock,
      label: '비밀번호 변경',
      path: '/settings/password',
      color: 'text-stone-600',
      bgColor: 'bg-stone-100',
    },
    {
      icon: Bell,
      label: '공지사항',
      path: '/announcements',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 - Safe Area 적용 */}
      <header className="bg-white/80 backdrop-blur-lg px-4 py-4 shadow-soft sticky top-0 z-10 border-b border-stone-100 safe-area-pt">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
          <h1 className="text-lg font-semibold text-stone-800">설정</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 사용자 정보 카드 */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-button">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Heart size={24} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name || '사용자'}</p>
              <p className="text-rose-100 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* 빠른 메뉴 (모바일 하단 탭에 없는 메뉴들) */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 overflow-hidden md:hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-stone-50 to-stone-100/50 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-600">빠른 메뉴</h2>
          </div>
          {quickMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <div>
                  <span className="text-stone-800 font-medium block">{item.label}</span>
                  <span className="text-stone-500 text-xs">{item.description}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-stone-400" />
            </Link>
          ))}
        </div>

        {/* 관리자 메뉴 (관리자만 표시) */}
        {user?.is_admin && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-rose-100/50 border-b border-rose-100">
              <h2 className="text-sm font-semibold text-rose-600">관리자</h2>
            </div>
            <Link
              to="/admin"
              className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <Shield size={20} className="text-rose-600" />
                </div>
                <span className="text-stone-800 font-medium">관리자 대시보드</span>
              </div>
              <ChevronRight size={20} className="text-stone-400" />
            </Link>
          </div>
        )}

        {/* 계정 설정 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 overflow-hidden">
          <div className="px-4 py-3 bg-stone-50/50 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-600">계정 설정</h2>
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                  <item.icon size={20} className={item.color} />
                </div>
                <span className="text-stone-800 font-medium">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-stone-400" />
            </Link>
          ))}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 text-red-500 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
