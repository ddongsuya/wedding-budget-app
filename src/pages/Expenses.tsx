import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, CreditCard, Wallet, Trash2, Edit2, ChevronDown, Calendar, Clock, CheckCircle2, Download } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudget } from '@/hooks/useBudget';
import { expenseAPI, ExpenseCreateInput, ExpenseUpdateInput } from '@/api/expenses';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useHaptic } from '@/hooks/useHaptic';
import { EmptyState } from '@/components/common/EmptyState';
import { ExpensesSkeleton } from '@/components/skeleton/ExpensesSkeleton';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { SwipeToDelete } from '@/components/common/SwipeToDelete';
import { ExpenseForm } from '../components/expense/ExpenseForm';
import { CategoryBudgetProgress } from '../components/expense/CategoryBudgetProgress';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { Expense, BudgetCategory } from '@/types/types';
import { invalidateQueries } from '@/lib/queryClient';
import { getIconByName } from '@/utils/iconMap';
import { PageTip } from '@/components/common/PageTip/PageTip';
import { formatMoneyShort } from '@/utils/formatMoney';
import { exportToCSV } from '@/utils/exportData';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type FilterPayer = 'all' | 'groom' | 'bride' | 'shared';
type ExpenseTab = 'all' | 'completed' | 'planned';
type SortBy = 'date' | 'amount';

const Expenses: React.FC = () => {
  const { toast } = useToast();
  const { haptic } = useHaptic();
  const { expenses: apiExpenses, loading, fetchExpenses } = useExpenses();
  const { categories: apiCategories } = useBudget();
  const [searchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [filterPayer, setFilterPayer] = useState<FilterPayer>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<ExpenseTab>('all');
  const [statusChangeExpense, setStatusChangeExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  // URL 파라미터에서 category_id 읽어 자동 필터 적용
  useEffect(() => {
    const categoryId = searchParams.get('category_id');
    if (categoryId) {
      setFilterCategory(categoryId);
      setShowFilters(true);
    }
  }, [searchParams]);

  // Pull-to-Refresh 핸들러
  const handleRefresh = async () => {
    await fetchExpenses();
  };

  const budgetCategories: BudgetCategory[] = apiCategories.map(c => ({
    id: String(c.id),
    name: c.name,
    icon: c.icon || 'Package',
    parentId: null,
    budgetAmount: c.budget_amount || 0,
    spentAmount: c.spent_amount || 0,
    color: c.color || '#f43f5e',
  }));

  const expenses: Expense[] = (apiExpenses as any[])?.map((e: any) => ({
    id: String(e.id),
    categoryId: String(e.category_id || ''),
    title: e.title,
    amount: Number(e.amount) || 0,
    paymentDate: e.date,
    paidBy: (e.payer || 'shared') as 'groom' | 'bride' | 'shared',
    status: (e.status || 'completed') as 'completed' | 'planned',
    dueDate: e.due_date || null,
    paymentMethod: (e.payment_method || 'card') as 'cash' | 'card' | 'transfer',
    paymentType: 'full' as const,
    vendorName: e.vendor || '',
    receiptUrl: null,
    memo: e.notes || '',
    createdAt: e.created_at || new Date().toISOString(),
    updatedAt: e.updated_at || new Date().toISOString(),
  })) || [];

  const filteredExpenses = useMemo(() => {
    let result = [...expenses];
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.vendorName?.toLowerCase().includes(query) ||
        e.memo?.toLowerCase().includes(query)
      );
    }
    if (filterPayer !== 'all') {
      result = result.filter(e => e.paidBy === filterPayer);
    }
    if (filterCategory !== 'all') {
      result = result.filter(e => e.categoryId === filterCategory);
    }
    if (activeTab !== 'all') {
      result = result.filter(e => e.status === activeTab);
    }
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      }
      return b.amount - a.amount;
    });
    return result;
  }, [expenses, searchQuery, filterPayer, filterCategory, sortBy, activeTab]);

  // 무한 스크롤: 표시할 항목 제한 (Requirements 10.2)
  const visibleExpenses = useMemo(() => filteredExpenses.slice(0, visibleCount), [filteredExpenses, visibleCount]);
  const hasMoreExpenses = visibleCount < filteredExpenses.length;

  const sentinelRef = useInfiniteScroll({
    onLoadMore: () => setVisibleCount(prev => prev + 20),
    hasMore: hasMoreExpenses,
    isLoading: false,
  });

  // 필터 변경 시 visibleCount 리셋
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, filterPayer, filterCategory, sortBy, activeTab]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const groomTotal = expenses.filter(e => e.paidBy === 'groom').reduce((sum, e) => sum + e.amount, 0);
    const brideTotal = expenses.filter(e => e.paidBy === 'bride').reduce((sum, e) => sum + e.amount, 0);
    return { total, groomTotal, brideTotal, count: expenses.length };
  }, [expenses]);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  // 모바일용 축약 금액 포맷
  const formatMoneyCompact = (amount: number) => formatMoneyShort(amount);

  const getCategoryName = (categoryId: string) => budgetCategories.find(c => c.id === categoryId)?.name || '미분류';
  const getCategoryIconName = (categoryId: string) => budgetCategories.find(c => c.id === categoryId)?.icon || 'Package';
  const getCategoryColor = (categoryId: string) => budgetCategories.find(c => c.id === categoryId)?.color || '#f43f5e';

  const handleSaveExpense = async (expense: Expense) => {
    // 결제 예정 → 결제 완료 변경 감지: 결제일 자동 설정 확인
    if (
      editingExpense &&
      editingExpense.status === 'planned' &&
      expense.status === 'completed'
    ) {
      setStatusChangeExpense(expense);
      return;
    }
    await saveExpense(expense);
  };

  const saveExpense = async (expense: Expense) => {
    try {
      const categoryId = expense.categoryId ? parseInt(expense.categoryId) : null;
      const validCategoryId = categoryId && !isNaN(categoryId) ? categoryId : undefined;

      if (editingExpense) {
        const updateData: ExpenseUpdateInput = {
          title: expense.title, amount: expense.amount, date: expense.paymentDate,
          payer: expense.paidBy === 'shared' ? 'groom' : expense.paidBy,
          category_id: validCategoryId, payment_method: expense.paymentMethod,
          vendor: expense.vendorName || undefined, notes: expense.memo || undefined,
          status: expense.status, due_date: expense.dueDate || undefined,
        };
        await expenseAPI.update(editingExpense.id, updateData);
        toast.success('지출이 수정되었습니다');
      } else {
        const createData: ExpenseCreateInput = {
          title: expense.title, amount: expense.amount, date: expense.paymentDate,
          payer: expense.paidBy === 'shared' ? 'groom' : expense.paidBy,
          category_id: validCategoryId, payment_method: expense.paymentMethod,
          vendor: expense.vendorName || undefined, notes: expense.memo || undefined,
          status: expense.status, due_date: expense.dueDate || undefined,
        };
        await expenseAPI.create(createData);
        toast.success('지출이 등록되었습니다');
      }
      invalidateQueries.expenses();
      invalidateQueries.budget();
      invalidateQueries.stats();
      window.dispatchEvent(new CustomEvent('expense-updated'));
      setShowExpenseForm(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('지출 저장 실패:', error);
      toast.error((error as any)?.userMessage || '지출 저장에 실패했습니다');
    }
  };

  const handleDeleteExpense = async (id: string, skipConfirm = false) => {
    if (!skipConfirm) {
      setDeletingExpenseId(id);
      return;
    }
    await performDeleteExpense(id);
  };

  const performDeleteExpense = async (id: string) => {
    haptic('warning');
    try {
      await expenseAPI.delete(id);
      toast.success('지출이 삭제되었습니다');
      invalidateQueries.expenses();
      invalidateQueries.budget();
      invalidateQueries.stats();
      window.dispatchEvent(new CustomEvent('expense-updated'));
      fetchExpenses();
    } catch (error) {
      console.error('지출 삭제 실패:', error);
      toast.error((error as any)?.userMessage || '지출 삭제에 실패했습니다');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleConfirmStatusChange = async (autoSetDate: boolean) => {
    if (!statusChangeExpense) return;
    const expense = autoSetDate
      ? { ...statusChangeExpense, paymentDate: new Date().toISOString().split('T')[0] }
      : statusChangeExpense;
    setStatusChangeExpense(null);
    await saveExpense(expense);
  };

  const handleExportCSV = () => {
    const data = filteredExpenses.map(e => ({
      제목: e.title,
      금액: e.amount,
      카테고리: getCategoryName(e.categoryId),
      결제일: e.paymentDate,
      결제자: getPayerLabel(e.paidBy),
      상태: e.status === 'completed' ? '결제 완료' : '결제 예정',
      결제수단: e.paymentMethod === 'card' ? '카드' : e.paymentMethod === 'cash' ? '현금' : '이체',
      업체: e.vendorName || '',
      메모: e.memo || '',
    }));
    exportToCSV(data, `지출내역_${new Date().toISOString().split('T')[0]}.csv`);
    toast.success('CSV 파일이 다운로드되었습니다');
  };

  const getPayerLabel = (payer: string) => {
    switch (payer) { case 'groom': return '신랑'; case 'bride': return '신부'; default: return '공동'; }
  };
  const getPayerColor = (payer: string) => {
    switch (payer) { case 'groom': return 'bg-blue-100 text-blue-700'; case 'bride': return 'bg-pink-100 text-pink-700'; default: return 'bg-purple-100 text-purple-700'; }
  };
  const getPaymentMethodIcon = (method: string) => {
    switch (method) { case 'card': return <CreditCard size={14} />; case 'cash': return <Wallet size={14} />; default: return <CreditCard size={14} />; }
  };

  if (loading) return <ExpensesSkeleton />;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="space-y-6">
      <PageTip pageKey="expenses" />
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">지출 목록</h1>
          <p className="text-sm text-stone-500 mt-1">총 {stats.count}건의 지출 내역</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2.5 border border-stone-200 text-stone-600 rounded-xl hover:bg-stone-50 transition-colors text-sm font-medium"
            title="CSV 내보내기"
          >
            <Download size={16} />
            <span className="hidden sm:inline">내보내기</span>
          </button>
          <button
            onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
          >
            <Plus size={18} />지출 추가
          </button>
        </div>
      </div>

      {/* 통계 카드 - 합계 표시 */}
      <div className="bg-white rounded-xl p-4 md:p-5 border border-stone-100 shadow-sm">
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100">
            <p className="text-xs text-stone-500 mb-1 md:mb-2">총 지출</p>
            <p className="text-base md:text-2xl font-bold text-stone-800 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(stats.total)}</span>
              <span className="hidden md:inline">{formatMoney(stats.total)}</span>
            </p>
            <p className="text-xs text-stone-400 mt-1">{stats.count}건</p>
          </div>
          <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-xs text-blue-600 mb-1 md:mb-2 flex items-center justify-center gap-1">
              <span>💙</span> <span className="hidden sm:inline">신랑 부담</span><span className="sm:hidden">신랑</span>
            </p>
            <p className="text-base md:text-2xl font-bold text-blue-700 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(stats.groomTotal)}</span>
              <span className="hidden md:inline">{formatMoney(stats.groomTotal)}</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">
              {expenses.filter(e => e.paidBy === 'groom').length}건
            </p>
          </div>
          <div className="text-center p-3 md:p-4 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100">
            <p className="text-xs text-pink-600 mb-1 md:mb-2 flex items-center justify-center gap-1">
              <span>💗</span> <span className="hidden sm:inline">신부 부담</span><span className="sm:hidden">신부</span>
            </p>
            <p className="text-base md:text-2xl font-bold text-pink-700 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(stats.brideTotal)}</span>
              <span className="hidden md:inline">{formatMoney(stats.brideTotal)}</span>
            </p>
            <p className="text-xs text-pink-400 mt-1">
              {expenses.filter(e => e.paidBy === 'bride').length}건
            </p>
          </div>
        </div>
      </div>

      {/* 상태별 탭 */}
      <div className="bg-white rounded-xl border border-stone-100 p-1 flex gap-1">
        {([
          { key: 'all' as const, label: '전체' },
          { key: 'completed' as const, label: '결제 완료' },
          { key: 'planned' as const, label: '결제 예정' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 카테고리 예산 진행률 바 (카테고리 필터 활성 시) */}
      {filterCategory !== 'all' && (() => {
        const cat = budgetCategories.find(c => c.id === filterCategory);
        if (!cat) return null;
        return (
          <CategoryBudgetProgress
            categoryName={cat.name}
            budgetAmount={cat.budgetAmount}
            spentAmount={cat.spentAmount}
          />
        );
      })()}

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-xl p-4 border border-stone-100 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text" placeholder="지출 내역 검색..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-800">
          <Filter size={16} />필터 {showFilters ? '접기' : '펼치기'}
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-100">
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">결제자</label>
                  <select value={filterPayer} onChange={(e) => setFilterPayer(e.target.value as FilterPayer)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
                    <option value="all">전체</option><option value="groom">신랑</option><option value="bride">신부</option><option value="shared">공동</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">카테고리</label>
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
                    <option value="all">전체</option>
                    {budgetCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-500 mb-1 block">정렬</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm">
                    <option value="date">날짜순</option><option value="amount">금액순</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => { setSearchQuery(''); setFilterPayer('all'); setFilterCategory('all'); setSortBy('date'); }} className="w-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">초기화</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 지출 목록 */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          illustration="expense"
          title="지출 내역이 없습니다"
          description={searchQuery || filterPayer !== 'all' || filterCategory !== 'all' ? "검색 조건에 맞는 지출이 없습니다" : "첫 번째 지출을 등록해보세요"}
          actionLabel="지출 추가"
          onAction={() => { setEditingExpense(null); setShowExpenseForm(true); }}
        />
      ) : (
        <div className="space-y-3">
          {visibleExpenses.map((expense) => (
            <SwipeToDelete key={expense.id} onDelete={() => handleDeleteExpense(expense.id, true)}>
            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {(() => {
                    const IconComponent = getIconByName(getCategoryIconName(expense.categoryId));
                    return (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: getCategoryColor(expense.categoryId) }}
                      >
                        <IconComponent size={18} />
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-stone-800 truncate">{expense.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPayerColor(expense.paidBy)}`}>{getPayerLabel(expense.paidBy)}</span>
                      {/* 결제 상태 뱃지 */}
                      {expense.status === 'planned' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                          <Clock size={10} />예정
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={10} />완료
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1"><Calendar size={12} />{new Date(expense.paymentDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '')}</span>
                      <span className="flex items-center gap-1">{getPaymentMethodIcon(expense.paymentMethod)}{expense.paymentMethod === 'card' ? '카드' : expense.paymentMethod === 'cash' ? '현금' : '이체'}</span>
                      <span>{getCategoryName(expense.categoryId)}</span>
                    </div>
                    {/* 결제 예정일 표시 */}
                    {expense.status === 'planned' && expense.dueDate && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600">
                        <Clock size={12} />
                        <span>결제 예정일: {new Date(expense.dueDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    )}
                    {expense.vendorName && <p className="text-xs text-stone-400 mt-1">{expense.vendorName}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className={`font-bold whitespace-nowrap ${expense.status === 'planned' ? 'text-amber-600' : 'text-stone-800'}`}>{formatMoney(expense.amount)}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditExpense(expense)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors" aria-label="수정"><Edit2 size={16} className="text-stone-400" /></button>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" aria-label="삭제"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
              </div>
              {expense.memo && <p className="mt-2 pt-2 border-t border-stone-50 text-sm text-stone-500">{expense.memo}</p>}
            </motion.div>
            </SwipeToDelete>
          ))}
          {/* 무한 스크롤 센티넬 */}
          {hasMoreExpenses && <div ref={sentinelRef} className="h-4" />}
        </div>
      )}

      {/* 지출 폼 모달 */}
      {showExpenseForm && (
        <ExpenseForm
          initialData={editingExpense}
          categories={budgetCategories}
          onSubmit={handleSaveExpense}
          onCancel={() => { setShowExpenseForm(false); setEditingExpense(null); }}
        />
      )}

      {/* 결제 상태 변경 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={!!statusChangeExpense}
        onClose={() => handleConfirmStatusChange(false)}
        onConfirm={() => handleConfirmStatusChange(true)}
        title="결제일 자동 설정"
        message="결제 완료로 변경합니다. 결제일을 오늘 날짜로 자동 설정할까요?"
        confirmLabel="오늘로 설정"
        cancelLabel="기존 날짜 유지"
        variant="info"
      />

      {/* 지출 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={() => {
          if (deletingExpenseId) performDeleteExpense(deletingExpenseId);
          setDeletingExpenseId(null);
        }}
        title="지출 삭제"
        message="정말 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </div>
    </PullToRefresh>
  );
};

export default Expenses;
