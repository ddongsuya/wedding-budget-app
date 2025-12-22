import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, X } from 'lucide-react';
import { adminAPI } from '../api/admin';
import { useToastContext } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { EmptyState } from '../components/common/EmptyState';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

const AdminAnnouncements = () => {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'notice',
    priority: 0,
  });

  useEffect(() => {
    if (!user?.is_admin) {
      showToast('error', '관리자 권한이 필요합니다');
      navigate('/');
      return;
    }
    loadAnnouncements();
  }, [user, navigate]);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getAnnouncements();
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      showToast('error', '공지사항을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await adminAPI.updateAnnouncement(editingAnnouncement.id, formData);
        showToast('success', '공지사항이 수정되었습니다');
      } else {
        await adminAPI.createAnnouncement(formData);
        showToast('success', '공지사항이 등록되었습니다');
      }
      setShowModal(false);
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', type: 'notice', priority: 0 });
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      showToast('error', '저장에 실패했습니다');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await adminAPI.deleteAnnouncement(id);
      showToast('success', '공지사항이 삭제되었습니다');
      loadAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      showToast('error', '삭제에 실패했습니다');
    }
  };

  const openNewModal = () => {
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '', type: 'notice', priority: 0 });
    setShowModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-rose-300 border-t-rose-500 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-bold text-gray-800">공지사항 관리</h1>
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
            >
              <Plus size={18} />
              새 공지
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm">
            <EmptyState
              illustration="notification"
              title="등록된 공지사항이 없습니다"
              description="새 공지사항을 등록해보세요"
              actionLabel="공지사항 등록"
              onAction={() => setShowModal(true)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        announcement.type === 'notice' ? 'bg-blue-100 text-blue-700' :
                        announcement.type === 'event' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {announcement.type === 'notice' ? '공지' : announcement.type === 'event' ? '이벤트' : '긴급'}
                      </span>
                      {announcement.priority >= 5 && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">중요</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800">{announcement.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{announcement.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => handleEdit(announcement)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Edit2 size={16} className="text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(announcement.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingAnnouncement ? '공지사항 수정' : '새 공지사항'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 h-32"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="notice">공지</option>
                    <option value="event">이벤트</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">우선순위 (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600"
                >
                  {editingAnnouncement ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnouncements;
