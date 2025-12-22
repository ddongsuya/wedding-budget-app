import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseAPI, ExpenseCreateInput, ExpenseUpdateInput, ExpenseListParams } from '../../api/expenses';
import { queryKeys } from '../../lib/queryClient';
import type { Expense } from '../../../types';

/**
 * 지출 목록 조회 훅
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const useExpensesQuery = (params?: ExpenseListParams) => {
  return useQuery({
    queryKey: queryKeys.expenses.list(params),
    queryFn: async () => {
      const response = await expenseAPI.getList(params);
      return {
        expenses: response.data.expenses as Expense[],
        pagination: response.data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 3 * 60 * 1000, // 3분 동안 신선 (지출은 자주 변경될 수 있음)
  });
};

/**
 * 지출 상세 조회 훅
 */
export const useExpenseDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.expenses.detail(id),
    queryFn: async () => {
      const response = await expenseAPI.getById(id);
      return response.data.expense as Expense;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 지출 추가 훅
 */
export const useAddExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ExpenseCreateInput) => expenseAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 지출 업데이트 훅
 */
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseUpdateInput }) => 
      expenseAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 지출 삭제 훅
 */
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => expenseAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.budget.categories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
};

/**
 * 영수증 업로드 훅
 */
export const useUploadReceipt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('receipt', file);
      return expenseAPI.uploadReceipt(id, formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.detail(variables.id) });
    },
  });
};
