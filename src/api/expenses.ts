import apiClient from './client';

export interface ExpenseListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  category_id?: number;
  payer?: 'groom' | 'bride';
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface ExpenseCreateInput {
  category_id?: number;
  title: string;
  amount: number;
  date: string;
  payer: 'groom' | 'bride';
  payment_method?: string;
  vendor?: string;
  notes?: string;
}

export type ExpenseUpdateInput = Partial<ExpenseCreateInput>;

export const expenseAPI = {
  getList: (params?: ExpenseListParams) => apiClient.get('/expenses', { params }),
  getById: (id: string) => apiClient.get(`/expenses/${id}`),
  create: (data: ExpenseCreateInput) => apiClient.post('/expenses', data),
  update: (id: string, data: ExpenseUpdateInput) => apiClient.put(`/expenses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/expenses/${id}`),
  uploadReceipt: (id: string, formData: FormData) =>
    apiClient.post(`/expenses/${id}/receipt`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
