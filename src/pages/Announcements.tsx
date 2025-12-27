import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Pin, AlertCircle, Info, Megaphone, Wrench } from 'lucide-react';
import { adminAPI, Announcement } from '../api/admin';
import { useToastContext } from '../contexts/ToastContext';
import { EmptyState } from '../components/common/EmptyState';

const Announcements = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getActiveAnnouncements();
      setAnnouncements(response.data.data);
    } catch (error: any) {
      console.error('Failed to load announcements:', error);
      showToast('error', '공지사항을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new':
        return <Megaphone size={18} className="text-blue-500" />;
      case 'update':
        return <Info size={18} className="text-green-500" />;
      case 'maintenance':
        return <Wrench size={18} className="text-orange-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'new':
        return '새소식';
      case 'update':
        return '업데이트';
      case 'maintenance':
        return '점검';
      case 'notice':
        return '공지';
      default:
        return '공지';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'update':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 3) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
          <AlertCircle size={12} />
          긴급
        </span>
      );
    }
    if (priority >= 2) {
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
          중요
        </span>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-lg shadow-soft border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-stone-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center shadow-button">
                <Bell size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-stone-800">공지사항</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {announcements.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-card border border-stone-100">
            <EmptyState
              illustration="notification"
              title="등록된 공지사항이 없습니다"
              description="새로운 공지사항이 등록되면 여기에 표시됩니다"
              actionLabel="새로고침"
              onAction={loadAnnouncements}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-card border border-stone-100 hover:shadow-card-hover transition-all"
              >
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeIcon(announcement.type)}
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(announcement.type)}`}
                    >
                      {getTypeLabel(announcement.type)}
                    </span>
                    {getPriorityBadge(announcement.priority)}
                  </div>
                  <span className="text-xs text-stone-500">
                    {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* 제목 */}
                <h3 className="text-lg font-bold text-stone-800 mb-2">{announcement.title}</h3>

                {/* 내용 */}
                <p className="text-stone-600 whitespace-pre-wrap leading-relaxed">
                  {announcement.content}
                </p>

                {/* 기간 표시 */}
                {announcement.end_date && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      📅 {new Date(announcement.start_date).toLocaleDateString('ko-KR')} ~{' '}
                      {new Date(announcement.end_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
