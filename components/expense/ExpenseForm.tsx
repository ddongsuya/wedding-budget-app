
import React, { useState } from 'react';
import { Expense, BudgetCategory } from '../../types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { X, DollarSign, Tag, CreditCard, User, FileText, Briefcase } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Expense | null;
  categories: BudgetCategory[];
  onSubmit: (expense: Expense) => Promise<void> | void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, categories, onSubmit, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    categoryId: categories[0]?.id || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    paidBy: 'shared',
    vendorName: '',
    paymentType: 'full',
    status: 'completed',
    memo: '',
    receiptUrl: null,
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 0) {
      value = String(parseInt(value, 10));
      if (isNaN(parseInt(value, 10))) value = '';
    }
    setFormData(prev => ({ ...prev, amount: value === '' ? 0 : parseInt(value, 10) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const expense: Expense = {
        id: initialData?.id || Math.random().toString(36).substr(2, 9),
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        title: formData.title || '',
        amount: Number(formData.amount),
        categoryId: formData.categoryId || '',
        paymentDate: formData.paymentDate || '',
        paymentMethod: formData.paymentMethod as 'card' | 'cash' | 'transfer',
        paidBy: formData.paidBy as 'groom' | 'bride' | 'shared',
        vendorName: formData.vendorName || '',
        paymentType: formData.paymentType as 'full' | 'deposit' | 'interim' | 'balance',
        status: formData.status as 'completed' | 'planned',
        receiptUrl: formData.receiptUrl || null,
        memo: formData.memo || ''
      };
      await onSubmit(expense);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center p-0 md:p-4 bg-white md:bg-stone-900/60 md:backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl shadow-none md:shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="text-xl font-bold text-stone-800">
            {initialData ? '지출 내역 수정' : '지출 내역 추가'}
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 safe-area-pb">
          
          {/* Main Info */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><FileText size={14}/> 항목명 <span className="text-rose-500">*</span></label>
              <input 
                required 
                name="title" 
                type="text"
                autoComplete="off"
                autoCapitalize="sentences"
                value={formData.title} 
                onChange={handleChange} 
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-base" 
                placeholder="예: 웨딩홀 계약금" 
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><DollarSign size={14}/> 금액 <span className="text-rose-500">*</span></label>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9,]*"
                autoComplete="off"
                required 
                name="amount" 
                value={formData.amount && formData.amount > 0 ? formData.amount.toLocaleString() : ''} 
                onChange={handleAmountChange} 
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-base" 
                placeholder="0" 
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
               <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><Tag size={14}/> 카테고리 <span className="text-rose-500">*</span></label>
               <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white text-base">
                 <option value="" disabled>선택해주세요</option>
                 {categories.map(cat => (
                   <option key={cat.id} value={cat.id}>{cat.name}</option>
                 ))}
               </select>
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <DatePicker
                label="결제일"
                required
                value={formData.paymentDate || ''}
                onChange={(date) => setFormData(prev => ({ ...prev, paymentDate: date }))}
              />
            </div>
          </section>

          {/* Payment Details */}
          <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100 space-y-4">
             <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wider">결제 상세 정보</h4>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><CreditCard size={14}/> 결제 수단</label>
                 <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white text-base">
                   <option value="card">카드</option>
                   <option value="cash">현금</option>
                   <option value="transfer">계좌이체</option>
                 </select>
               </div>
               
               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><User size={14}/> 분담</label>
                 <select name="paidBy" value={formData.paidBy} onChange={handleChange} className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white text-base">
                   <option value="shared">공동 부담</option>
                   <option value="groom">신랑 부담</option>
                   <option value="bride">신부 부담</option>
                 </select>
               </div>

               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><Briefcase size={14}/> 업체명</label>
                 <input 
                   name="vendorName" 
                   type="text"
                   autoComplete="organization"
                   autoCapitalize="words"
                   value={formData.vendorName} 
                   onChange={handleChange} 
                   className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-base" 
                   placeholder="업체 이름" 
                 />
               </div>

               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-stone-700">결제 유형</label>
                 <select name="paymentType" value={formData.paymentType} onChange={handleChange} className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white text-base">
                   <option value="full">전액 결제</option>
                   <option value="deposit">계약금</option>
                   <option value="interim">중도금</option>
                   <option value="balance">잔금</option>
                 </select>
               </div>
               
               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-stone-700">상태</label>
                 <div className="flex gap-4 pt-2 min-h-[48px] items-center">
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-2">
                      <input type="radio" name="status" value="completed" checked={formData.status === 'completed'} onChange={handleChange} className="accent-rose-500 w-5 h-5" />
                      <span className="text-sm text-stone-700">결제 완료</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer min-h-[44px] px-2">
                      <input type="radio" name="status" value="planned" checked={formData.status === 'planned'} onChange={handleChange} className="accent-rose-500 w-5 h-5" />
                      <span className="text-sm text-stone-700">결제 예정</span>
                    </label>
                 </div>
               </div>
             </div>
          </section>

          {/* Additional Info */}
          <section className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-sm font-medium text-stone-700">영수증 첨부 (이미지)</label>
                <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 min-h-[48px] text-center hover:border-rose-300 transition-colors cursor-pointer bg-stone-50">
                   <p className="text-xs text-stone-500">클릭하여 이미지를 업로드하세요 (준비중)</p>
                   <input type="file" accept="image/*" className="hidden" />
                </div>
             </div>
             <div className="space-y-1.5">
               <label className="text-sm font-medium text-stone-700">메모</label>
               <textarea 
                 name="memo" 
                 autoCapitalize="sentences"
                 value={formData.memo} 
                 onChange={handleChange} 
                 rows={2} 
                 className="w-full px-4 py-3 min-h-[80px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none text-base" 
                 placeholder="특이사항을 입력하세요" 
               />
             </div>
          </section>

        </form>

        <div className="p-4 border-t border-stone-100 flex gap-3 bg-white shrink-0 safe-area-pb">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>취소</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit} loading={isSaving} disabled={isSaving}>
            {isSaving ? '저장 중...' : (initialData ? '수정 완료' : '등록하기')}
          </Button>
        </div>
      </div>
    </div>
  );
};
