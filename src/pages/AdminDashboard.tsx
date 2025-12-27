import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserPlus,
  Heart,
  TrendingUp,
  Bell,
  ArrowLeft,
} from 'lucide-react';
import { adminAPI, DashboardStats } from '../api/admin';
import { useToastContext } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 관리자 권한 확인
    if (!user?.is_admin) {
      showToast('error', '관리자 권한이 필요합니다');
      navigate('/');
      return;
    }

    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getDashboardStats();
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      showToast('error', '통계를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: '전체 사용자',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: `+${stats.newUsers} 오늘`,
    },
    {
      title: '활성 사용자',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '최근 7일',
    },
    {
      title: '신규 가입',
      value: stats.newUsers,
      icon: UserPlus,
      color: 'bg-purple-500',
      change: '오늘',
    },
    {
      title: '연결된 커플',
      value: stats.connectedCouples,
      icon: Heart,
      color: 'bg-rose-500',
      change: `/ ${stats.totalCouples} 전체`,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-lg shadow-soft border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-stone-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-stone-800">관리자 대시보드</h1>
                <p className="text-stone-500">Needless Wedding 관리 패널</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-xl border border-rose-100">
              <span className="text-sm text-stone-600">관리자:</span>
              <span className="font-semibold text-rose-600">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 p-6 hover:shadow-card-hover transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-stone-800">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-stone-400 mt-1">{card.change}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color} shadow-lg`}>
                  <card.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 주간 가입 추이 */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-rose-500" />
            주간 가입 추이
          </h3>
          <div className="space-y-3">
            {stats.weeklyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-stone-600">
                  {new Date(stat.date).toLocaleDateString('ko-KR')}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-stone-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-rose-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((stat.count / Math.max(...stats.weeklyStats.map(s => s.count))) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-medium text-stone-800 w-8 text-right">{stat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 p-6 hover:shadow-card-hover transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-500 transition-colors">
                <Users size={24} className="text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-800">사용자 관리</h3>
                <p className="text-sm text-stone-500">사용자 목록 및 권한 관리</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/announcements')}
            className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100 p-6 hover:shadow-card-hover transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-500 transition-colors">
                <Bell size={24} className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-800">공지사항 관리</h3>
                <p className="text-sm text-stone-500">앱 공지사항 작성 및 관리</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
