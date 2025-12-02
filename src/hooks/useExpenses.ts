import { useState, useEffect, useCallback } from 'react';
import { expenseAPI, ExpenseCreateInput, ExpenseUpdateInput, ExpenseListParams } from '../api/expenses';
import { Expense } from '../types';

export const useExpenses = (params?: ExpenseListParams) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchExpenses = useCallback(async (fetchParams?: ExpenseListParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.getList(fetchParams || params);
      setExpenses(response.data.expenses);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '지출 목록을 불러오는데 실패했습니다';
      setError(errorMsg);
      
      const cached = localStorage.getItem('expenses_cache');
      if (cached) {
        setExpenses(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, [params]);

  const addExpense = async (data: ExpenseCreateInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.create(data);
      const newExpense = response.data.expense;
      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '지출 추가에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, data: ExpenseUpdateInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await expenseAPI.update(id, data);
      const updatedExpense = response.data.expense;
      setExpenses((prev) => prev.map((e) => (e.id === id ? updatedExpense : e)));
      return updatedExpense;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '지출 수정에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await expenseAPI.delete(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '지출 삭제에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadReceipt = async (id: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await expenseAPI.uploadReceipt(id, formData);
      const updatedExpense = response.data.expense;
      setExpenses((prev) => prev.map((e) => (e.id === id ? updatedExpense : e)));
      return updatedExpense;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || '영수증 업로드에 실패했습니다';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem('expenses_cache', JSON.stringify(expenses));
    }
  }, [expenses]);

  return {
    expenses,
    loading,
    error,
    pagination,
    fetchExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt,
  };
};
