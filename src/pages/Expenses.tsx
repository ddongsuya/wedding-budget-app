import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, CreditCard, Wallet, Trash2, Edit2, ChevronDown, Calendar } from 'lucide-react';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudget } from '@/hooks/useBudget';
import { expenseAPI, ExpenseCreateInput, ExpenseUpdateInput } from '@/api/expenses';
import { useToast } from '@/hooks/useToast';
import { EmptyState } from '@/components/common/EmptyState';
import { ExpensesSkeleton } from '@/components/skeleton/ExpensesSkeleton';
import { ExpenseForm } from '../components/expense/ExpenseForm';
import { Expense, BudgetCategory } from '@/types/types';
import { invalidateQueries } from '@/lib/queryClient';
import { getIconByName } from '@/utils/iconMap';

type FilterPayer = 'all' | 'groom' | 'bride' | 'shared';
type SortBy = 'date' | 'amount';

const Expenses: React.FC = () => {
  const { toast } = useToast();
  const { expenses: apiExpenses, loading, fetchExpenses } = useExpenses();
  const { categories: apiCategories } = useBudget();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayer, setFilterPayer] = useState<FilterPayer>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

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
    amount: e.amount,
    paymentDate: e.date,
    paidBy: (e.payer || 'shared') as 'groom' | 'bride' | 'shared',
    status: 'completed' as const,
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
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      }
      return b.amount - a.amount;
    });
    return result;
  }, [expenses, searchQuery, filterPayer, filterCategory, sortBy]);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const groomTotal = expenses.filter(e => e.paidBy === 'groom').reduce((sum, e) => sum + e.amount, 0);
    const brideTotal = expenses.filter(e => e.paidBy === 'bride').reduce((sum, e) => sum + e.amount, 0);
    return { total, groomTotal, brideTotal, count: expenses.length };
  }, [expenses]);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const getCategoryName = (categoryId: string) => budgetCategories.find(c => c.id === categoryId)?.name || '미분류';
  const getCategoryIconName = (categoryId: string) => budgetCategories.find(c => c.id === categoryId)?.icon || 'Package';
  const getCategoryColor = (categoryId: string) => budgetCategories.find(c => c.id === categoryId)?.color || '#f43f5e';

  const handleSaveExpense = async (expense: Expense) => {
    try {
      const categoryId = expense.categoryId ? parseInt(expense.categoryId) : null;
      const validCategoryId = categoryId && !isNaN(categoryId) ? categoryId : undefined;

      if (editingExpense) {
        const updateData: ExpenseUpdateInput = {
          title: expense.title, amount: expense.amount, date: expense.paymentDate,
          payer: expense.paidBy === 'shared' ? 'groom' : expense.paidBy,
          category_id: validCategoryId, payment_method: expense.paymentMethod,
          vendor: expense.vendorName || undefined, notes: expense.memo || undefined,
        };
        await expenseAPI.update(editingExpense.id, updateData);
        toast.success('지출이 수정되었습니다');
      } else {
        const createData: ExpenseCreateInput = {
          title: expense.title, amount: expense.amount, date: expense.paymentDate,
          payer: expense.paidBy === 'shared' ? 'groom' : expense.paidBy,
          category_id: validCategoryId, payment_method: expense.paymentMethod,
          vendor: expense.vendorName || undefined, notes: expense.memo || undefined,
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
      toast.error('지출 저장에 실패했습니다');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
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
      toast.error('지출 삭제에 실패했습니다');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
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
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">지출 목록</h1>
          <p className="text-sm text-stone-500 mt-1">총 {stats.count}건 · {formatMoney(stats.total)}</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors font-medium"
        >
          <Plus size={18} />지출 추가
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-stone-100">
          <p className="text-xs text-stone-500 mb-1">총 지출</p>
          <p className="text-lg font-bold text-stone-800">{formatMoney(stats.total)}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-xs text-blue-600 mb-1">신랑 부담</p>
          <p className="text-lg font-bold text-blue-700">{formatMoney(stats.groomTotal)}</p>
        </div>
        <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
          <p className="text-xs text-pink-600 mb-1">신부 부담</p>
          <p className="text-lg font-bold text-pink-700">{formatMoney(stats.brideTotal)}</p>
        </div>
      </div>

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
          {filteredExpenses.map((expense) => (
            <motion.div key={expense.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 border border-stone-100 hover:shadow-md transition-shadow">
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
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1"><Calendar size={12} />{new Date(expense.paymentDate).toLocaleDateString('ko-KR')}</span>
                      <span className="flex items-center gap-1">{getPaymentMethodIcon(expense.paymentMethod)}{expense.paymentMethod === 'card' ? '카드' : expense.paymentMethod === 'cash' ? '현금' : '이체'}</span>
                      <span>{getCategoryName(expense.categoryId)}</span>
                    </div>
                    {expense.vendorName && <p className="text-xs text-stone-400 mt-1">{expense.vendorName}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-stone-800 whitespace-nowrap">{formatMoney(expense.amount)}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEditExpense(expense)} className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors" aria-label="수정"><Edit2 size={16} className="text-stone-400" /></button>
                    <button onClick={() => handleDeleteExpense(expense.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" aria-label="삭제"><Trash2 size={16} className="text-red-400" /></button>
                  </div>
                </div>
              </div>
              {expense.memo && <p className="mt-2 pt-2 border-t border-stone-50 text-sm text-stone-500">{expense.memo}</p>}
            </motion.div>
          ))}
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
    </div>
  );
};

export default Expenses;
