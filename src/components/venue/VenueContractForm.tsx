import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Calendar, Users, Utensils, Building, Gift, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { ContractInput, venueContractAPI } from '@/api/venueContracts';
import { useToast } from '@/hooks/useToast';
import { formatMoneyShort } from '@/utils/formatMoney';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useKeyboardAvoid } from '@/hooks/useKeyboardAvoid';
import { useFormValidation, ValidationRule } from '@/hooks/useFormValidation';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';

interface VenueContractFormProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
  onSaved: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { id: 1, title: '기본 정보', icon: Calendar, description: '행사일시, 장소, 인원' },
  { id: 2, title: '비용 상세', icon: Building, description: '식사, 대관, 장비' },
  { id: 3, title: '멤버십 특전', icon: Gift, description: '계약 특전 혜택' },
  { id: 4, title: '계약 내용', icon: FileText, description: '계약금, 위약 조건' },
] as const;

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

export const VenueContractForm: React.FC<VenueContractFormProps> = ({
  venueId, venueName, onClose, onSaved,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<ContractInput>({});
  const modalRef = React.useRef<HTMLDivElement>(null);

  // 모바일 키보드 회피 (Requirements 10.1)
  useKeyboardAvoid(modalRef);

  // 인라인 에러 메시지 (Requirements 12.1)
  const validationRules = React.useMemo(() => ({
    deposit_amount: [{ min: 0, message: '계약금은 0 이상이어야 합니다' }] as ValidationRule[],
  }), []);
  const { errors: formErrors, validateField: validateContractField } = useFormValidation(validationRules);

  // 임시 저장 훅 (Requirements 6.5)
  const draftKey = `venue_contract_${venueId}`;
  const { draft, setDraft, clearDraft, hasDraft } = useFormDraft<ContractInput>(draftKey);
  const [showDraftRestore, setShowDraftRestore] = useState(false);

  useEffect(() => {
    loadContract();
  }, [venueId]);

  // 임시 저장 데이터 복원 확인 (Requirements 6.5)
  useEffect(() => {
    if (!loading && hasDraft) {
      setShowDraftRestore(true);
    }
  }, [loading, hasDraft]);

  // 폼 데이터 변경 시 자동 임시 저장
  useEffect(() => {
    if (!loading && Object.keys(formData).length > 0) {
      setDraft(formData);
    }
  }, [formData, loading]);

  // 앱 이탈 시 임시 저장 (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(formData).length > 0) {
        setDraft(formData);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, setDraft]);

  const handleRestoreDraft = () => {
    if (draft) {
      setFormData(draft);
      toast.success('임시 저장된 데이터를 복원했습니다');
    }
    setShowDraftRestore(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftRestore(false);
  };

  const loadContract = async () => {
    try {
      setLoading(true);
      const response = await venueContractAPI.get(venueId);
      if (response.data.contract) {
        setFormData(response.data.contract);
      }
    } catch (error) {
      console.error('Load contract error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await venueContractAPI.upsert(venueId, formData);
      clearDraft(); // 저장 성공 시 임시 저장 삭제
      toast.success('계약 정보가 저장되었습니다');
      onSaved();
    } catch (error) {
      console.error('Save contract error:', error);
      toast.error((error as any)?.userMessage || '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ContractInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep((currentStep + 1) as Step);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
  };

  const totalAmount = 
    (formData.hall_rental_fee || 0) +
    (formData.wedding_supplies_fee || 0) +
    (formData.equipment_lighting_fee || 0) +
    (formData.equipment_video_fee || 0) +
    (formData.equipment_bgm_fee || 0) +
    (formData.equipment_confetti_fee || 0) +
    (formData.pyebaek_fee || 0) +
    (formData.meal_total_price || 0) +
    (formData.alcohol_service_included ? 0 : (formData.alcohol_service_price || 0));

  // Input Components - Enter 키 방지 + 음수 방지 (Requirements 12.4)
  const InputField: React.FC<{
    label: string; value: string | number | undefined; onChange: (v: string) => void;
    type?: string; placeholder?: string; className?: string;
  }> = ({ label, value, onChange, type = 'text', placeholder, className = '' }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        {...(type === 'number' ? { min: 0, onInput: (e: React.FormEvent<HTMLInputElement>) => { const input = e.currentTarget; if (Number(input.value) < 0) input.value = '0'; } } : {})}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none text-base"
      />
    </div>
  );

  const TextArea: React.FC<{
    label?: string; value: string | undefined; onChange: (v: string) => void;
    placeholder?: string; rows?: number;
  }> = ({ label, value, onChange, placeholder, rows = 2 }) => (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium text-stone-700">{label}</label>}
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none resize-none"
      />
    </div>
  );

  // Step 1: 기본 정보
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
        <h3 className="font-semibold text-rose-800 mb-1">📅 행사 정보</h3>
        <p className="text-xs text-rose-600">예식 일시와 장소를 입력해주세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="행사일시"
          type="datetime-local"
          value={formData.event_datetime?.slice(0, 16) || ''}
          onChange={(v) => updateField('event_datetime', v)}
        />
        <InputField
          label="행사장소 (홀)"
          value={formData.event_location || ''}
          onChange={(v) => updateField('event_location', v)}
          placeholder="예: 그랜드볼룸 A홀"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="피로연장"
          value={formData.reception_hall || ''}
          onChange={(v) => updateField('reception_hall', v)}
          placeholder="피로연 장소"
        />
        <InputField
          label="식사보증인원"
          type="number"
          value={formData.guaranteed_guests || ''}
          onChange={(v) => updateField('guaranteed_guests', parseInt(v) || 0)}
          placeholder="명"
        />
      </div>

      <InputField
        label="식권 갯수"
        type="number"
        value={formData.meal_ticket_count || ''}
        onChange={(v) => updateField('meal_ticket_count', parseInt(v) || 0)}
        placeholder="제공되는 식권 수"
      />

      {/* 신랑/신부 정보 */}
      <div className="bg-gradient-to-r from-blue-50 to-pink-50 rounded-2xl p-4 space-y-4">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <Users size={18} /> 신랑/신부 정보
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="text-center text-sm font-medium text-blue-600 mb-2">💙 신랑</div>
            <input
              type="text"
              value={formData.groom_name || ''}
              onChange={(e) => updateField('groom_name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="이름"
              className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm"
            />
            <input
              type="tel"
              value={formData.groom_contact || ''}
              onChange={(e) => updateField('groom_contact', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="연락처"
              className="w-full px-3 py-2.5 border border-blue-200 rounded-xl text-sm"
            />
          </div>
          <div className="space-y-3">
            <div className="text-center text-sm font-medium text-pink-600 mb-2">💗 신부</div>
            <input
              type="text"
              value={formData.bride_name || ''}
              onChange={(e) => updateField('bride_name', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="이름"
              className="w-full px-3 py-2.5 border border-pink-200 rounded-xl text-sm"
            />
            <input
              type="tel"
              value={formData.bride_contact || ''}
              onChange={(e) => updateField('bride_contact', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="연락처"
              className="w-full px-3 py-2.5 border border-pink-200 rounded-xl text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 2: 비용 상세
  const renderStep2 = () => (
    <div className="space-y-6">
      {/* 식사 비용 */}
      <div className="bg-amber-50 rounded-2xl p-4 space-y-4 border border-amber-100">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <Utensils size={18} /> 식사 비용
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="식사 코스명"
            value={formData.meal_course_name || ''}
            onChange={(v) => updateField('meal_course_name', v)}
            placeholder="예: 프리미엄 한정식"
          />
          <InputField
            label="1인당 요금"
            type="number"
            value={formData.meal_course_price || ''}
            onChange={(v) => updateField('meal_course_price', parseInt(v) || 0)}
            placeholder="원"
          />
        </div>
        <InputField
          label="식사 총액"
          type="number"
          value={formData.meal_total_price || ''}
          onChange={(v) => updateField('meal_total_price', parseInt(v) || 0)}
          placeholder="원"
        />
        <div className="flex items-center justify-between p-3 bg-white rounded-xl">
          <span className="text-sm text-amber-800">주류 서비스 무료 제공</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.alcohol_service_included || false}
              onChange={(e) => updateField('alcohol_service_included', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>
        {!formData.alcohol_service_included && (
          <InputField
            label="주류 서비스 가격"
            type="number"
            value={formData.alcohol_service_price || ''}
            onChange={(v) => updateField('alcohol_service_price', parseInt(v) || 0)}
          />
        )}
      </div>

      {/* 대관료 */}
      <div className="bg-stone-50 rounded-2xl p-4 space-y-4 border border-stone-200">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <Building size={18} /> 대관 비용
        </h3>
        <InputField
          label="홀 대관료"
          type="number"
          value={formData.hall_rental_fee || ''}
          onChange={(v) => updateField('hall_rental_fee', parseInt(v) || 0)}
        />
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="혼구용품 내용"
            value={formData.wedding_supplies || ''}
            onChange={(v) => updateField('wedding_supplies', v)}
            placeholder="촛대, 꽃장식 등"
          />
          <InputField
            label="혼구용품 비용"
            type="number"
            value={formData.wedding_supplies_fee || ''}
            onChange={(v) => updateField('wedding_supplies_fee', parseInt(v) || 0)}
          />
        </div>
      </div>

      {/* 예식 장비 */}
      <div className="bg-purple-50 rounded-2xl p-4 space-y-4 border border-purple-100">
        <h3 className="font-semibold text-purple-800">🎬 예식 장비</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'lighting', label: '조명/영상연출', emoji: '💡' },
            { key: 'video', label: '영상연출', emoji: '🎥' },
            { key: 'bgm', label: 'BGM 서비스', emoji: '🎵' },
            { key: 'confetti', label: '축포', emoji: '🎊' },
          ].map(item => (
            <div key={item.key} className="bg-white rounded-xl p-3 border border-purple-100">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={(formData as any)[`equipment_${item.key}`] || false}
                  onChange={(e) => updateField(`equipment_${item.key}` as keyof ContractInput, e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm font-medium">{item.emoji} {item.label}</span>
              </label>
              {(formData as any)[`equipment_${item.key}`] && (
                <input
                  type="number"
                  min={0}
                  value={(formData as any)[`equipment_${item.key}_fee`] || ''}
                  onChange={(e) => updateField(`equipment_${item.key}_fee` as keyof ContractInput, parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => { if (Number(e.currentTarget.value) < 0) e.currentTarget.value = '0'; }}
                  placeholder="비용 (원)"
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 폐백 */}
      <div className="bg-rose-50 rounded-2xl p-4 space-y-3 border border-rose-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-rose-800">🎎 폐백 진행</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.pyebaek_included || false}
              onChange={(e) => updateField('pyebaek_included', e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded"
            />
            <span className="text-sm text-rose-700">포함</span>
          </label>
        </div>
        <InputField
          label="폐백 비용"
          type="number"
          value={formData.pyebaek_fee || ''}
          onChange={(v) => updateField('pyebaek_fee', parseInt(v) || 0)}
        />
      </div>
    </div>
  );

  // Step 3: 멤버십 특전
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-1">🎁 웨딩 계약 특전</h3>
        <p className="text-xs text-green-600">계약 시 제공되는 혜택을 입력해주세요</p>
      </div>

      {/* 특전 항목들 */}
      <div className="space-y-4">
        {[
          { key: 'hotel_room', label: '호텔룸 제공', emoji: '🏨', placeholder: '예: 스위트룸 1박, 체크인 시간 등' },
          { key: 'meals', label: '식사 제공', emoji: '🍽️', placeholder: '예: 신랑신부 식사 2인분 제공' },
          { key: 'wedding_cake', label: '웨딩 케익', emoji: '🎂', placeholder: '예: 3단 케익, 디자인 선택 가능' },
        ].map(item => (
          <div key={item.key} className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                (formData as any)[`benefit_${item.key}`] ? 'bg-green-100' : 'bg-stone-100'
              }`}>
                {item.emoji}
              </div>
              <span className="font-medium text-stone-800 flex-1">{item.label}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={(formData as any)[`benefit_${item.key}`] || false}
                  onChange={(e) => updateField(`benefit_${item.key}` as keyof ContractInput, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </div>
            </label>
            {(formData as any)[`benefit_${item.key}`] && (
              <textarea
                value={(formData as any)[`benefit_${item.key}_memo`] || ''}
                onChange={(e) => updateField(`benefit_${item.key}_memo` as keyof ContractInput, e.target.value)}
                placeholder={item.placeholder}
                rows={2}
                className="w-full px-4 py-3 border border-green-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 outline-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* 기타 특전 */}
      <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">✨</div>
          <span className="font-medium text-stone-800">기타 특전</span>
        </div>
        <textarea
          value={formData.benefit_other || ''}
          onChange={(e) => updateField('benefit_other', e.target.value)}
          placeholder="그 외 제공되는 특전을 자유롭게 입력해주세요"
          rows={4}
          className="w-full px-4 py-3 border border-green-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 outline-none"
        />
      </div>
    </div>
  );

  // Step 4: 계약 내용
  const renderStep4 = () => (
    <div className="space-y-6">
      {/* 총 계약 금액 요약 */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-5 text-white">
        <p className="text-sm text-white/80 mb-1">총 계약 금액</p>
        <p className="text-3xl font-bold whitespace-nowrap">
          <span className="md:hidden">{formatMoneyShort(totalAmount)}</span>
          <span className="hidden md:inline">{formatMoney(totalAmount)}</span>
        </p>
      </div>

      {/* 계약금 */}
      <div className="bg-blue-50 rounded-2xl p-4 space-y-4 border border-blue-100">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2">
          💰 계약금
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="계약금"
            type="number"
            value={formData.deposit_amount || ''}
            onChange={(v) => updateField('deposit_amount', parseInt(v) || 0)}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">납부일</label>
            <input
              type="date"
              value={formData.deposit_paid_date || ''}
              onChange={(e) => updateField('deposit_paid_date', e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
            />
          </div>
        </div>
        <label className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={formData.deposit_paid || false}
            onChange={(e) => updateField('deposit_paid', e.target.checked)}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-blue-800">계약금 납부 완료</span>
          {formData.deposit_paid && <Check size={18} className="text-green-500 ml-auto" />}
        </label>
        <TextArea
          value={formData.deposit_memo || ''}
          onChange={(v) => updateField('deposit_memo', v)}
          placeholder="계약금 관련 메모 (분할 납부 조건 등)"
        />
      </div>

      {/* 변경/위약 조건 */}
      <div className="bg-amber-50 rounded-2xl p-4 space-y-4 border border-amber-100">
        <h3 className="font-semibold text-amber-800 flex items-center gap-2">
          <AlertCircle size={18} /> 변경/위약 조건
        </h3>
        <TextArea
          label="날짜 변경 조건"
          value={formData.date_change_condition || ''}
          onChange={(v) => updateField('date_change_condition', v)}
          placeholder="예: 3개월 전 변경 시 수수료 없음, 1개월 전 변경 시 10% 수수료"
          rows={3}
        />
        <TextArea
          label="위약금 조건"
          value={formData.cancellation_penalty || ''}
          onChange={(v) => updateField('cancellation_penalty', v)}
          placeholder="예: 계약 취소 시 계약금 50% 환불"
          rows={3}
        />
      </div>

      {/* 기타 메모 */}
      <TextArea
        label="계약 관련 기타 메모"
        value={formData.contract_memo || ''}
        onChange={(v) => updateField('contract_memo', v)}
        placeholder="기타 계약 관련 메모"
        rows={4}
      />
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto" />
          <p className="mt-4 text-stone-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col md:items-center md:justify-center">
      {/* 임시 저장 복원 확인 다이얼로그 (Requirements 6.5) */}
      <ConfirmDialog
        isOpen={showDraftRestore}
        onClose={handleDiscardDraft}
        onConfirm={handleRestoreDraft}
        title="임시 저장 데이터 발견"
        message="이전에 작성 중이던 계약 정보가 있습니다. 복원하시겠습니까?"
        confirmLabel="복원하기"
        cancelLabel="새로 작성"
        variant="info"
      />
      <div ref={modalRef} className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-stone-200 bg-white safe-area-pt">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-800">계약 정보 입력</h2>
              <p className="text-sm text-stone-500">{venueName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <X size={24} className="text-stone-600" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id as Step)}
                    className={`flex flex-col items-center gap-1 transition-all ${
                      isActive ? 'scale-105' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-rose-500 text-white' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-stone-100 text-stone-400'
                    }`}>
                      {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                    </div>
                    <span className={`text-[10px] font-medium hidden sm:block ${
                      isActive ? 'text-rose-600' : 'text-stone-400'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-stone-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 safe-area-pb">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="shrink-0 p-4 border-t border-stone-200 bg-white safe-area-pb">
          <div className="flex gap-3">
            {currentStep > 1 ? (
              <button
                onClick={prevStep}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
              >
                <ChevronLeft size={18} /> 이전
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
              >
                취소
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors"
              >
                다음 <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium hover:from-rose-600 hover:to-pink-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                계약 확정하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueContractForm;
