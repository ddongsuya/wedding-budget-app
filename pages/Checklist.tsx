import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Calendar, AlertCircle, Edit2, Trash2, X } from 'lucide-react';
import { checklistAPI } from '../src/api/checklist';
import { ChecklistItem, ChecklistCategory, ChecklistStats, DuePeriod } from '../src/types/checklist';
import { useToast } from '../src/hooks/useToast';
import { EmptyState } from '../src/components/common/EmptyState/EmptyState';
import { ChecklistSkeleton } from '../src/components/skeleton/ChecklistSkeleton';

const DUE_PERIODS: { value: DuePeriod; label: string }[] = [
  { value: 'D-180', label: 'D-180 (6개월 전)' },
  { value: 'D-150', label: 'D-150 (5개월 전)' },
  { value: 'D-120', label: 'D-120 (4개월 전)' },
  { value: 'D-90', label: 'D-90 (3개월 전)' },
  { value: 'D-60', label: 'D-60 (2개월 전)' },
  { value: 'D-30', label: 'D-30 (1개월 전)' },
  { value: 'D-14', label: 'D-14 (2주 전)' },
  { value: 'D-7', label: 'D-7 (1주 전)' },
  { value: 'D-1', label: 'D-1 (하루 전)' },
  { value: 'D-DAY', label: 'D-DAY' },
  { value: 'AFTER', label: '결혼 후' },
];

const Checklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [categories, setCategories] = useState<ChecklistCategory[]>([]);
  const [stats, setStats] = useState<ChecklistStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [selectedCategory, showCompleted]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [itemsRes, categoriesRes, statsRes] = await Promise.all([
        checklistAPI.getItems({
          category_id: selectedCategory || undefined,
          is_completed: showCompleted ? undefined : false,
        }),
        checklistAPI.getCategories(),
        checklistAPI.getStats(),
      ]);

      setItems(itemsRes.data.data);
      setCategories(categoriesRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      toast.error('데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 완료 토글
  const handleToggle = async (id: string) => {
    try {
      await checklistAPI.toggleComplete(id);
      
      setItems(prev => prev.map(item =>
        item.id === id
          ? { ...item, is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date().toISOString() : null }
          : item
      ));

      // 통계 새로고침
      const statsRes = await checklistAPI.getStats();
      setStats(statsRes.data.data);

      const item = items.find(i => i.id === id);
      toast.success(item?.is_completed ? '완료 취소' : '완료! 🎉');
    } catch (error) {
      toast.error('업데이트에 실패했습니다');
    }
  };

  // 기본 템플릿 불러오기
  const handleInitDefaults = async () => {
    try {
      await checklistAPI.initDefaults();
      toast.success('기본 체크리스트가 생성되었습니다!');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '생성에 실패했습니다');
    }
  };

  // 아이템 수정
  const handleEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // 아이템 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;

    try {
      await checklistAPI.deleteItem(id);
      toast.success('삭제되었습니다');
      loadData();
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
  };

  // 아이템 저장 (추가/수정)
  const handleSave = async (data: Partial<ChecklistItem>) => {
    try {
      if (editingItem) {
        await checklistAPI.updateItem(editingItem.id, data);
        toast.success('수정되었습니다');
      } else {
        await checklistAPI.createItem(data);
        toast.success('항목이 추가되었습니다');
      }
      setShowEditModal(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      toast.error('저장에 실패했습니다');
    }
  };

  // D-day 기준 그룹핑
  const groupedItems = items.reduce((acc, item) => {
    const period = item.due_period || 'NONE';
    if (!acc[period]) acc[period] = [];
    acc[period].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (isLoading) return <ChecklistSkeleton />;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      {/* 헤더 */}
      <div className="bg-white px-4 py-6 shadow-sm sticky top-[60px] md:top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800">체크리스트</h1>
          <button
            onClick={() => { setEditingItem(null); setShowEditModal(true); }}
            className="bg-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            항목 추가
          </button>
        </div>
        
        {/* 진행률 */}
        {stats && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone-600">진행률</span>
              <span className="font-bold text-rose-500">{stats.completionRate}%</span>
            </div>
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-stone-500 mt-1">
              <span>{stats.completed}개 완료</span>
              <span>{stats.pending}개 남음</span>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
              !selectedCategory
                ? 'bg-rose-500 text-white'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            전체
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="max-w-[60px] sm:max-w-none truncate">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 빈 상태 */}
      {items.length === 0 ? (
        <EmptyState
          illustration="checklist"
          title="체크리스트가 비어있어요"
          description="기본 결혼 준비 체크리스트를 불러오거나 직접 추가해보세요"
          actionLabel="기본 템플릿 불러오기"
          onAction={handleInitDefaults}
        />
      ) : (
        <div className="p-4 space-y-6">
          {/* D-day 그룹별 표시 */}
          {DUE_PERIODS.map(period => {
            const periodItems = groupedItems[period.value];
            if (!periodItems || periodItems.length === 0) return null;

            const completedCount = periodItems.filter(i => i.is_completed).length;

            return (
              <div key={period.value} className="space-y-2 animate-fade-in">
                {/* 그룹 헤더 */}
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-stone-800 flex items-center gap-2">
                    <Calendar size={16} className="text-rose-400" />
                    {period.label}
                  </h2>
                  <span className="text-sm text-stone-500">
                    {completedCount}/{periodItems.length}
                  </span>
                </div>

                {/* 아이템 목록 */}
                <div className="space-y-2">
                  {periodItems.map(item => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 transition-all hover:shadow-md ${
                        item.is_completed ? 'opacity-60' : ''
                      }`}
                    >
                      {/* 체크박스 */}
                      <button
                        onClick={() => handleToggle(item.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {item.is_completed ? (
                          <CheckCircle2 size={24} className="text-green-500" />
                        ) : (
                          <Circle size={24} className="text-stone-300 hover:text-stone-400" />
                        )}
                      </button>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${item.is_completed ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                          {item.title}
                        </p>
                        {item.category_name && (
                          <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                            <span>{item.category_icon}</span>
                            {item.category_name}
                          </p>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit2 size={16} className="text-stone-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>

                      {/* 우선순위 */}
                      {item.priority === 'high' && !item.is_completed && (
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 아이템 추가/수정 모달 */}
      {showEditModal && (
        <ChecklistItemModal
          item={editingItem}
          categories={categories}
          onClose={() => { setShowEditModal(false); setEditingItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

// 체크리스트 아이템 추가/수정 모달
interface ChecklistItemModalProps {
  item: ChecklistItem | null;
  categories: ChecklistCategory[];
  onClose: () => void;
  onSave: (data: Partial<ChecklistItem>) => void;
}

const ChecklistItemModal: React.FC<ChecklistItemModalProps> = ({ item, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    category_id: item?.category_id || '',
    due_period: item?.due_period || 'D-90' as DuePeriod,
    priority: item?.priority || 'medium',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    onSave({
      ...formData,
      category_id: formData.category_id || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[85vh] md:max-h-[90vh] md:mx-4 flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl">
          <h2 className="text-xl font-bold text-stone-800">
            {item ? '항목 수정' : '항목 추가'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X size={24} className="text-stone-600" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="예: 청첩장 발송하기"
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              카테고리
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">선택 안함</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* 시기 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              완료 시기
            </label>
            <select
              value={formData.due_period}
              onChange={(e) => handleChange('due_period', e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              {DUE_PERIODS.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              우선순위
            </label>
            <div className="flex gap-2">
              {[
                { value: 'low', label: '낮음', color: 'bg-stone-100 text-stone-600' },
                { value: 'medium', label: '보통', color: 'bg-blue-100 text-blue-600' },
                { value: 'high', label: '높음', color: 'bg-red-100 text-red-600' },
              ].map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleChange('priority', p.value)}
                  className={`flex-1 py-2 rounded-xl font-medium transition-all ${
                    formData.priority === p.value
                      ? p.color + ' ring-2 ring-offset-1 ring-rose-500'
                      : 'bg-stone-50 text-stone-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              메모
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="추가 메모를 입력하세요"
              rows={2}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* 버튼 - 하단 고정 */}
        <div 
          className="flex-shrink-0 flex gap-3 p-4 border-t border-stone-200 bg-white"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
          >
            {item ? '수정' : '추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checklist;
