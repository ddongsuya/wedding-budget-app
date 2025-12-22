import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetAPI, BudgetSettings, BudgetCategoryInput } from '../../api/budget';
import { queryKeys } from '../../lib/queryClient';

export interface BudgetCategory {
  id: number;
  name: string;
  icon?: string;
  budget_amount: number;
  spent_amount: number;
  color?: string;
  order: number;
}

/**
 * 예산 설정 조회 훅
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const useBudgetSettings = () => {
  return useQuery({
    queryKey: queryKeys.budget.settings(),
    queryFn: async () => {
      const response = await budgetAPI.getSettings();
      const budget = response.data.budget;
      if (budget) {
        budget.total_budget = Number(budget.total_budget) || 0;
        budget.groom_ratio = Number(budget.groom_ratio) || 50;
        budget.bride_ratio = Number(budget.bride_ratio) || 50;
      }
      return budget;
    },
    staleTime: 10 * 60 * 1000, // 10분 동안 신선
  });
};

/**
 * 예산 설정 업데이트 훅
 */
export const useUpdateBudgetSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BudgetSettings) => budgetAPI.updateSettings(data),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.budget.settings(), response.data.budget);
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 예산 카테고리 목록 조회 훅
 */
export const useBudgetCategories = () => {
  return useQuery({
    queryKey: queryKeys.budget.categories(),
    queryFn: async () => {
      const response = await budgetAPI.getCategories();
      return (response.data.categories || []).map((c: BudgetCategory) => ({
        ...c,
        budget_amount: Number(c.budget_amount) || 0,
        spent_amount: Number(c.spent_amount) || 0,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5분 동안 신선
  });
};

/**
 * 카테고리 추가 훅
 */
export const useAddBudgetCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: BudgetCategoryInput) => budgetAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories() });
    },
  });
};

/**
 * 카테고리 업데이트 훅
 */
export const useUpdateBudgetCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BudgetCategoryInput> }) => 
      budgetAPI.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 카테고리 삭제 훅
 */
export const useDeleteBudgetCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => budgetAPI.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};
