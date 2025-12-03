import { Link } from 'react-router-dom';
import { Lock, ChevronRight, User, Bell, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SettingsMenu = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
      navigate('/login');
    }
  };

  const menuItems = [
    {
      icon: User,
      label: '프로필 설정',
      path: '/settings',
      color: 'text-blue-600',
    },
    {
      icon: Lock,
      label: '비밀번호 변경',
      path: '/settings/password',
      color: 'text-gray-600',
    },
    {
      icon: Bell,
      label: '알림 설정',
      path: '/settings/notifications',
      color: 'text-green-600',
    },
  ];

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
          <h1 className="text-lg font-semibold">설정</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* 계정 설정 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-semibold text-gray-600">계정 설정</h2>
          </div>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={item.color} />
                <span className="text-gray-800">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </Link>
          ))}
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-white rounded-xl shadow-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
