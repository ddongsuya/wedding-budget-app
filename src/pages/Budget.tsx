import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetSettings, BudgetCategory } from '@/types/types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BudgetSettingModal } from '../components/budget/BudgetSettingModal';
import { CategoryModal } from '../components/budget/CategoryModal';
import { BudgetListView } from '../components/budget/BudgetListView';
import { Plus, Settings, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { BudgetSkeleton } from '@/components/skeleton/BudgetSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { useBudget } from '@/hooks/useBudget';
import { formatMoneyShort } from '@/utils/formatMoney';
import { navigateCrossLink } from '@/utils/crossLink';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import { PageTip } from '@/components/common/PageTip/PageTip';

const Budget: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings, categories, loading, fetchCategories, updateSettings, addCategory, updateCategory, deleteCategory } = useBudget();
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  // API 데이터를 기존 형식으로 변환
  const budget: BudgetSettings = {
    totalBudget: settings?.total_budget || 0,
    groomRatio: settings?.groom_ratio || 50,
    brideRatio: settings?.bride_ratio || 50,
    weddingDate: '',
    categories: categories.map(c => ({
      id: String(c.id),
      name: c.name,
      icon: c.icon || 'Circle',
      parentId: null,
      budgetAmount: c.budget_amount || 0,
      spentAmount: c.spent_amount || 0,
      color: c.color || '#f43f5e',
    })),
  };

  if (loading) {
    return <BudgetSkeleton />;
  }

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  // 모바일용 축약 금액 포맷
  const formatMoneyCompact = (amount: number) => formatMoneyShort(amount);

  const calculateTotalAllocated = () => budget.categories.reduce((acc, c) => acc + c.budgetAmount, 0);
  const totalAllocated = calculateTotalAllocated();
  const unallocated = budget.totalBudget - totalAllocated;
  const totalSpent = budget.categories.reduce((acc, c) => acc + c.spentAmount, 0);

  // Ratio Calculations
  const groomAmount = budget.totalBudget * (budget.groomRatio / 100);
  const brideAmount = budget.totalBudget * (budget.brideRatio / 100);

  const handleUpdateSettings = async (newSettings: Partial<BudgetSettings>) => {
    try {
      await updateSettings({
        total_budget: newSettings.totalBudget,
        groom_ratio: newSettings.groomRatio,
        bride_ratio: newSettings.brideRatio,
      });
      toast.success('예산 설정이 저장되었습니다');
    } catch (_error) {
      toast.error((_error as any)?.userMessage || '설정 저장에 실패했습니다');
    }
  };

  const handleSaveCategory = async (category: BudgetCategory) => {
    try {
      if (editingCategory) {
        await updateCategory(category.id, {
          name: category.name,
          icon: category.icon,
          budget_amount: category.budgetAmount,
          color: category.color,
        });
        toast.success('카테고리가 수정되었습니다');
      } else {
        await addCategory({
          name: category.name,
          icon: category.icon,
          budget_amount: category.budgetAmount,
          color: category.color,
        });
        toast.success('카테고리가 추가되었습니다');
      }
      await fetchCategories();
      setEditingCategory(null);
    } catch (_error) {
      toast.error((_error as any)?.userMessage || '저장에 실패했습니다');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setDeletingCategoryId(id);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategoryId) return;
    try {
      await deleteCategory(deletingCategoryId);
      toast.success('카테고리가 삭제되었습니다');
    } catch (_error) {
      toast.error((_error as any)?.userMessage || '삭제에 실패했습니다');
    }
    setDeletingCategoryId(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <PageTip pageKey="budget" />
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">예산 관리</h2>
          <p className="text-stone-500 text-sm">항목별 예산을 계획하고 관리하세요.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Settings size={16} />} onClick={() => setIsSettingModalOpen(true)}>
            설정
          </Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}>
            카테고리
          </Button>
        </div>
      </div>

      {/* 예산 미설정 안내 배너 */}
      {budget.totalBudget === 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">총 예산을 설정해주세요</p>
            <p className="text-xs text-amber-600 mt-1">총 예산을 설정하면 카테고리별 예산 관리가 가능합니다</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsSettingModalOpen(true)}>
            설정하기
          </Button>
        </div>
      )}

      {/* Main Budget Status - 밝은 테마 */}
      <Card className="bg-white border border-stone-200 relative overflow-hidden">
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5">
          <div>
            <p className="text-xs text-stone-500 mb-1">총 예산</p>
            <p className="text-sm text-stone-400 hidden md:block">설정된 총 예산</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-stone-500 mb-1">배정됨</p>
            <p className="text-lg md:text-3xl font-bold text-rose-600 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(totalAllocated)}</span>
              <span className="hidden md:inline">{formatMoney(totalAllocated)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 mb-1">지출액</p>
            <p className="text-base md:text-2xl font-semibold text-stone-600 whitespace-nowrap">
              <span className="md:hidden">{formatMoneyCompact(totalSpent)}</span>
              <span className="hidden md:inline">{formatMoney(totalSpent)}</span>
            </p>
          </div>
        </div>
        
        {/* Allocation Alert */}
        <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-emerald-50">
          <div className={`w-2 h-2 rounded-full shrink-0 ${unallocated < 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
          <span className="text-sm text-emerald-700">
            {unallocated < 0 
              ? <span>예산이 <span className="font-bold">{formatMoneyCompact(Math.abs(unallocated))}</span> 초과</span>
              : <span>아직 <span className="font-bold">{formatMoneyCompact(unallocated)}</span> 배정 가능</span>
            }
          </span>
        </div>
           
        {/* Groom/Bride Ratio Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-600">💙</span>
              <span className="text-stone-600">신랑측 {budget.groomRatio}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-600">신부측 {budget.brideRatio}%</span>
              <span className="text-pink-600">💗</span>
            </div>
          </div>
          
          <div className="h-3 rounded-full overflow-hidden flex">
            <div className="bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-500" style={{ width: `${budget.groomRatio}%` }}></div>
            <div className="bg-gradient-to-r from-pink-400 to-pink-500 transition-all duration-500" style={{ width: `${budget.brideRatio}%` }}></div>
          </div>
          
          <div className="flex justify-between text-xs text-stone-500">
            <span className="md:hidden">{formatMoneyCompact(groomAmount)}</span>
            <span className="hidden md:inline">{formatMoney(groomAmount)}</span>
            <span className="md:hidden">{formatMoneyCompact(brideAmount)}</span>
            <span className="hidden md:inline">{formatMoney(brideAmount)}</span>
          </div>
        </div>
      </Card>

      {/* Categories List - 리스트 뷰 */}
      {budget.categories.length === 0 ? (
        <EmptyState
          illustration="budget"
          title="예산 카테고리를 추가해주세요"
          description="식장, 스드메, 예복 등 항목별로 예산을 배분해보세요"
          actionLabel="카테고리 추가하기"
          onAction={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
        />
      ) : (
        <BudgetListView
          categories={budget.categories}
          onCategoryClick={(category: BudgetCategory) => {
            navigateCrossLink(navigate, {
              target: '/expenses',
              filter: { category_id: category.id },
            });
          }}
        />
      )}

      {isSettingModalOpen && (
        <BudgetSettingModal 
          settings={budget} 
          onSave={handleUpdateSettings} 
          onClose={() => setIsSettingModalOpen(false)} 
        />
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          initialData={editingCategory}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingCategoryId}
        onClose={() => setDeletingCategoryId(null)}
        onConfirm={confirmDeleteCategory}
        title="카테고리 삭제"
        message="이 카테고리를 삭제하시겠습니까? 관련 지출 내역은 유지되지만 예산 정보는 사라집니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />
    </div>
  );
};

export default Budget;
