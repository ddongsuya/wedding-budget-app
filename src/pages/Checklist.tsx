import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Plus, Calendar, AlertCircle, Edit2, Trash2, X, Search, Eye, EyeOff } from 'lucide-react';
import { checklistAPI } from '@/api/checklist';
import { ChecklistItem, ChecklistCategory, ChecklistStats, DuePeriod } from '@/types/checklist';
import { useToast } from '@/hooks/useToast';
import { useHaptic } from '@/hooks/useHaptic';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { ChecklistSkeleton } from '@/components/skeleton/ChecklistSkeleton';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { CategoryDropdown } from '../components/checklist/CategoryDropdown';
import { CircularProgress } from '../components/checklist/CircularProgress';
import { ChecklistActionLinks } from '../components/checklist/ChecklistActionLinks';
import { navigateCrossLink } from '@/utils/crossLink';
import { computeAllChecklistRelatedSummaries, ChecklistRelatedSummary } from '@/utils/checklistRelatedData';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { useKeyboardAvoid } from '@/hooks/useKeyboardAvoid';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { eventAPI } from '@/api/events';
import { expenseAPI } from '@/api/expenses';
import { PageTip } from '@/components/common/PageTip/PageTip';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [relatedSummaries, setRelatedSummaries] = useState<Record<string, ChecklistRelatedSummary>>({});
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const { toast } = useToast();
  const { haptic } = useHaptic();
  const navigate = useNavigate();

  // 체크리스트 항목 완료 시 바로가기 핸들러
  const handleAddExpenseForItem = (item: ChecklistItem) => {
    navigateCrossLink(navigate, {
      target: '/expenses',
      action: 'add',
      filter: { checklist_item_id: item.id, checklist_title: item.title },
    });
  };

  const handleAddEventForItem = (item: ChecklistItem) => {
    navigateCrossLink(navigate, {
      target: '/schedule',
      action: 'add',
      filter: { checklist_item_id: item.id, checklist_title: item.title },
    });
  };

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [selectedCategory, showCompleted]);

  // 결혼 예정일 변경 시 체크리스트 데이터 갱신 (시기 계산 갱신)
  useEffect(() => {
    const handleWeddingDateChanged = () => {
      loadData();
    };
    window.addEventListener('wedding-date-changed', handleWeddingDateChanged);
    return () => {
      window.removeEventListener('wedding-date-changed', handleWeddingDateChanged);
    };
  }, []);

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

      // 연관 데이터 요약 로드
      try {
        const itemIds = itemsRes.data.data.map((i: ChecklistItem) => i.id);
        if (itemIds.length > 0) {
          const [eventsRes, expensesRes] = await Promise.all([
            eventAPI.getEvents(),
            expenseAPI.getList(),
          ]);
          const events = (eventsRes.data.data || []).map((e: any) => ({
            id: String(e.id),
            checklist_item_id: e.checklist_item_id ? String(e.checklist_item_id) : null,
          }));
          const expenses = (expensesRes.data.data || expensesRes.data.expenses || []).map((e: any) => ({
            id: String(e.id),
            checklist_item_id: e.checklist_item_id ? String(e.checklist_item_id) : null,
            amount: Number(e.amount) || 0,
          }));
          setRelatedSummaries(computeAllChecklistRelatedSummaries(itemIds, events, expenses));
        }
      } catch {
        // 연관 데이터 로드 실패 시 무시 (핵심 기능 아님)
      }
    } catch (error) {
      toast.error((error as any)?.userMessage || '데이터를 불러오는데 실패했습니다');
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
      toast.error((error as any)?.userMessage || '업데이트에 실패했습니다');
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
  const handleDelete = async (id: string, skipConfirm = false) => {
    if (!skipConfirm) {
      setDeletingItemId(id);
      return;
    }
    await performDelete(id);
  };

  const performDelete = async (id: string) => {
    haptic('warning');
    try {
      await checklistAPI.deleteItem(id);
      toast.success('삭제되었습니다');
      loadData();
    } catch (error) {
      toast.error((error as any)?.userMessage || '삭제에 실패했습니다');
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
      toast.error((error as any)?.userMessage || '저장에 실패했습니다');
    }
  };

  // 클라이언트 사이드 검색 필터링
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.title.toLowerCase().includes(query));
  }, [items, searchQuery]);

  // D-day 기준 그룹핑
  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMoreItems = visibleCount < filteredItems.length;

  const checklistSentinelRef = useInfiniteScroll({
    onLoadMore: () => setVisibleCount(prev => prev + 20),
    hasMore: hasMoreItems,
    isLoading: false,
  });

  const groupedItems = visibleItems.reduce((acc, item) => {
    const period = item.due_period || 'NONE';
    if (!acc[period]) acc[period] = [];
    acc[period].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  if (isLoading) return <ChecklistSkeleton />;

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      <PageTip pageKey="checklist" />
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-lg px-4 py-5 shadow-soft sticky top-[60px] md:top-0 z-10 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800">체크리스트</h1>
          <button
            onClick={() => { setEditingItem(null); setShowEditModal(true); }}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus size={18} />
            항목 추가
          </button>
        </div>
        
        {/* 진행률 - 원형 프로그레스 */}
        {stats && (
          <div className="mb-4 p-4 bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-2xl border border-rose-100">
            <div className="flex items-center gap-4">
              {/* 원형 진행률 */}
              <CircularProgress percentage={stats.completionRate} size="md" />
              
              {/* 통계 정보 */}
              <div className="flex-1">
                <h3 className="font-bold text-stone-800 mb-2">체크리스트 진행률</h3>
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 size={14} />
                    {stats.completed}개 완료
                  </span>
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <Circle size={14} />
                    {stats.pending}개 남음
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 필터 - 드롭다운 */}
        <CategoryDropdown
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* 검색 입력 필드 */}
        <div className="relative mt-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="체크리스트 검색..."
            className="w-full pl-9 pr-9 py-2.5 bg-stone-100 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-stone-200 rounded-full transition-colors"
              aria-label="검색어 초기화"
            >
              <X size={14} className="text-stone-500" />
            </button>
          )}
        </div>

        {/* 완료/미완료 필터 토글 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showCompleted
                ? 'bg-stone-100 text-stone-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {showCompleted ? (
              <>
                <Eye size={14} />
                완료 항목 표시 중
              </>
            ) : (
              <>
                <EyeOff size={14} />
                미완료만 표시
              </>
            )}
          </button>
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
              <div key={period.value} className="space-y-3 animate-fade-in">
                {/* 그룹 헤더 */}
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-stone-800 flex items-center gap-2">
                    <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center">
                      <Calendar size={14} className="text-rose-500" />
                    </div>
                    {period.label}
                  </h2>
                  <span className="text-sm text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg font-medium">
                    {completedCount}/{periodItems.length}
                  </span>
                </div>

                {/* 아이템 목록 */}
                <div className="space-y-2">
                  {periodItems.map((item, index) => (
                    <SwipeToDelete key={item.id} onDelete={() => handleDelete(item.id, true)}>
                    <div
                      className={`bg-white rounded-2xl p-4 shadow-card border border-stone-100 transition-all hover:shadow-card-hover stagger-item touch-feedback active:scale-[0.99] ${
                        item.is_completed ? 'opacity-60' : ''
                      }`}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div className="flex items-center gap-3">
                      {/* 체크박스 */}
                      <button
                        onClick={() => handleToggle(item.id)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {item.is_completed ? (
                          <CheckCircle2 size={24} className="text-emerald-500" />
                        ) : (
                          <Circle size={24} className="text-stone-300 hover:text-rose-400" />
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
                        {/* 연관 데이터 요약 뱃지 */}
                        {relatedSummaries[item.id] && (relatedSummaries[item.id].eventCount > 0 || relatedSummaries[item.id].expenseTotal > 0) && (
                          <div className="flex gap-2 mt-1.5">
                            {relatedSummaries[item.id].eventCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 rounded-full">
                                📅 일정 {relatedSummaries[item.id].eventCount}건
                              </span>
                            )}
                            {relatedSummaries[item.id].expenseTotal > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded-full">
                                💰 {relatedSummaries[item.id].expenseTotal.toLocaleString()}원
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
                          title="수정"
                        >
                          <Edit2 size={16} className="text-stone-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>

                      {/* 우선순위 */}
                      {item.priority === 'high' && !item.is_completed && (
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                      )}
                      </div>

                      {/* 완료 시 바로가기 버튼 */}
                      {item.is_completed && (
                        <div className="pl-9 mt-1">
                          <ChecklistActionLinks
                            itemId={item.id}
                            itemTitle={item.title}
                            onAddExpense={() => handleAddExpenseForItem(item)}
                            onAddEvent={() => handleAddEventForItem(item)}
                          />
                        </div>
                      )}
                    </div>
                    </SwipeToDelete>
                  ))}
                </div>
              </div>
            );
          })}
          {/* 무한 스크롤 센티넬 */}
          {hasMoreItems && <div ref={checklistSentinelRef} className="h-4" />}
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={!!deletingItemId}
        onClose={() => setDeletingItemId(null)}
        onConfirm={() => {
          if (deletingItemId) performDelete(deletingItemId);
          setDeletingItemId(null);
        }}
        title="항목 삭제"
        message="이 항목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
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
  const modalRef = React.useRef<HTMLDivElement>(null);
  useKeyboardAvoid(modalRef);
  const [formData, setFormData] = useState({
    title: item?.title || '',
    description: item?.description || '',
    category_id: item?.category_id || '',
    due_period: item?.due_period || 'D-90' as DuePeriod,
    priority: item?.priority || 'medium',
  });
  const [titleError, setTitleError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setTitleError('제목을 입력해주세요');
      return;
    }
    setTitleError('');

    onSave({
      ...formData,
      category_id: formData.category_id || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'title') setTitleError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20 md:pb-4">
      <div ref={modalRef} className="bg-white rounded-2xl w-full max-w-lg max-h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex-shrink-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
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
              className={`w-full px-4 py-2.5 border ${titleError ? 'border-red-400 focus:ring-red-500' : 'border-stone-300 focus:ring-rose-500'} rounded-xl focus:ring-2 focus:border-transparent`}
              required
            />
            {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
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
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-stone-200 bg-white rounded-b-2xl">
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
