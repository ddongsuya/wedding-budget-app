
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Expense, BudgetCategory } from '@/types/types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { X, DollarSign, Tag, CreditCard, User, FileText, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Expense | null;
  categories: BudgetCategory[];
  onSubmit: (expense: Expense) => Promise<void> | void;
  onCancel: () => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, categories, onSubmit, onCancel }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  
  // ref 동기화
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const [formData, setFormData] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    categoryId: categories[0]?.id || '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    paidBy: 'shared',
    vendorName: '',
    paymentType: 'full',
    status: initialData?.status || 'completed',
    dueDate: initialData?.dueDate || null,
    memo: '',
    receiptUrl: null,
    ...initialData
  });

  // 결제 예정 상태면 고급 옵션 자동 펼침
  const [showAdvanced, setShowAdvanced] = useState(initialData?.status === 'planned' || false);

  // handleCancel을 useCallback으로 먼저 정의
  const handleCancelAction = useCallback(() => {
    if (hasUnsavedChangesRef.current) {
      if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  }, [onCancel]);

  // 키보드 단축키: Ctrl+S 저장, Esc 닫기
  useKeyboardShortcuts({
    onSave: () => {
      if (!isSaving && formData.title?.trim() && formData.amount && formData.amount > 0) {
        formRef.current?.requestSubmit();
      }
    },
    onClose: handleCancelAction,
    enabled: true,
  });

  // 폼 변경 감지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 0) {
      value = String(parseInt(value, 10));
      if (isNaN(parseInt(value, 10))) value = '';
    }
    setFormData(prev => ({ ...prev, amount: value === '' ? 0 : parseInt(value, 10) }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!formData.title?.trim()) {
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      return;
    }
    
    setIsSaving(true);
    try {
      const expense: Expense = {
        id: initialData?.id || crypto.randomUUID(),
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
        dueDate: formData.status === 'planned' ? (formData.dueDate || null) : null,
        receiptUrl: formData.receiptUrl || null,
        memo: formData.memo || ''
      };
      await onSubmit(expense);
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Enter 키로 인한 의도치 않은 form submit 방지
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center p-0 md:p-4 bg-white md:bg-stone-900/60 md:backdrop-blur-sm animate-fade-in safe-area-inset">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl shadow-none md:shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white shrink-0 safe-area-pt-min">
          <h3 className="text-xl font-bold text-stone-800">
            {initialData ? '지출 내역 수정' : '지출 내역 추가'}
          </h3>
          <button onClick={handleCancelAction} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex-1 overflow-y-auto p-6 space-y-8 safe-area-pb">
          
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
                onChange={(date) => { setFormData(prev => ({ ...prev, paymentDate: date })); setHasUnsavedChanges(true); }}
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><User size={14}/> 분담</label>
              <select name="paidBy" value={formData.paidBy} onChange={handleChange} className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white text-base">
                <option value="shared">공동 부담</option>
                <option value="groom">신랑 부담</option>
                <option value="bride">신부 부담</option>
              </select>
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="text-sm font-medium text-stone-700">메모</label>
              <input 
                name="memo" 
                type="text"
                autoCapitalize="sentences"
                value={formData.memo} 
                onChange={handleChange} 
                className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none text-base" 
                placeholder="특이사항 (선택)" 
              />
            </div>
          </section>

          {/* Payment Details - 토글 가능한 고급 옵션 */}
          <section className="bg-stone-50 rounded-2xl border border-stone-100 overflow-hidden">
             <button
               type="button"
               onClick={() => setShowAdvanced(!showAdvanced)}
               className="w-full px-5 py-4 flex items-center justify-between hover:bg-stone-100 transition-colors"
             >
               <h4 className="text-sm font-bold text-stone-600 flex items-center gap-2">
                 <CreditCard size={16} />
                 결제 상세 정보 (선택)
               </h4>
               {showAdvanced ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
             </button>
             
             {showAdvanced && (
               <div className="px-5 pb-5 space-y-4 border-t border-stone-200">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                   <div className="space-y-1.5">
                     <label className="text-sm font-medium text-stone-700 flex items-center gap-1.5"><CreditCard size={14}/> 결제 수단</label>
                     <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-4 py-3 min-h-[48px] rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white text-base">
                       <option value="card">카드</option>
                       <option value="cash">현금</option>
                       <option value="transfer">계좌이체</option>
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
                   
                   {formData.status === 'planned' && (
                     <div className="space-y-1.5">
                       <DatePicker
                         label="결제 예정일"
                         value={formData.dueDate || ''}
                         onChange={(date) => { setFormData(prev => ({ ...prev, dueDate: date || null })); setHasUnsavedChanges(true); }}
                       />
                     </div>
                   )}
                 </div>
               </div>
             )}
          </section>

          {/* 버튼을 form 내부로 이동 */}
          <div className="p-4 border-t border-stone-100 flex gap-3 bg-white shrink-0 safe-area-pb-min -mx-6 -mb-8 mt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleCancelAction} disabled={isSaving}>취소</Button>
            <Button type="submit" variant="primary" className="flex-1" loading={isSaving} disabled={isSaving}>
              {isSaving ? '저장 중...' : (initialData ? '수정 완료' : '등록하기')}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
