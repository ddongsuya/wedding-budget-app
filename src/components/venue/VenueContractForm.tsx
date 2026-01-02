import React, { useState, useEffect } from 'react';
import { X, Save, ChevronDown, ChevronUp, Calendar, Users, Utensils, Building, Gift, FileText, Check, Clock, AlertCircle } from 'lucide-react';
import { VenueContract, ContractInput, venueContractAPI } from '@/api/venueContracts';
import { useToast } from '@/hooks/useToast';

interface VenueContractFormProps {
  venueId: string;
  venueName: string;
  onClose: () => void;
  onSaved: () => void;
}

type SectionKey = 'event' | 'meal' | 'rental' | 'benefits' | 'contract';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

export const VenueContractForm: React.FC<VenueContractFormProps> = ({
  venueId, venueName, onClose, onSaved,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(new Set(['event']));
  const [formData, setFormData] = useState<ContractInput>({});

  useEffect(() => {
    loadContract();
  }, [venueId]);

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

  const toggleSection = (section: SectionKey) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) newSet.delete(section);
    else newSet.add(section);
    setExpandedSections(newSet);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await venueContractAPI.upsert(venueId, formData);
      toast.success('계약 정보가 저장되었습니다');
      onSaved();
    } catch (error) {
      console.error('Save contract error:', error);
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ContractInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const SectionHeader: React.FC<{ section: SectionKey; icon: React.ReactNode; title: string; subtitle?: string }> = 
    ({ section, icon, title, subtitle }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-stone-800">{title}</h3>
          {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
        </div>
      </div>
      {expandedSections.has(section) ? <ChevronUp size={20} className="text-stone-400" /> : <ChevronDown size={20} className="text-stone-400" />}
    </button>
  );

  const InputField: React.FC<{
    label: string; value: string | number | undefined; onChange: (v: string) => void;
    type?: string; placeholder?: string; memoField?: keyof ContractInput; memoValue?: string;
  }> = ({ label, value, onChange, type = 'text', placeholder, memoField, memoValue }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none"
      />
      {memoField && (
        <textarea
          value={memoValue ?? ''}
          onChange={(e) => updateField(memoField, e.target.value)}
          placeholder="메모 (조건, 특이사항 등)"
          rows={2}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none resize-none"
        />
      )}
    </div>
  );

  const StatusBadge: React.FC<{ status: 'pending' | 'completed'; onToggle: () => void }> = ({ status, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        status === 'completed' 
          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      }`}
    >
      {status === 'completed' ? <Check size={14} /> : <Clock size={14} />}
      {status === 'completed' ? '지출완료' : '지출예정'}
    </button>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-stone-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div>
            <h2 className="text-xl font-bold text-stone-800">계약 정보 관리</h2>
            <p className="text-sm text-stone-500">{venueName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={24} className="text-stone-600" />
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-rose-600">총 계약 금액</p>
              <p className="text-2xl font-bold text-rose-700">{formatMoney(totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">계약금</p>
              <p className="text-lg font-semibold text-stone-700">{formatMoney(formData.deposit_amount || 0)}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. 행사 관련 */}
          <div className="space-y-3">
            <SectionHeader section="event" icon={<Calendar size={20} />} title="행사 관련" subtitle="일시, 장소, 인원 정보" />
            {expandedSections.has('event') && (
              <div className="pl-4 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="행사일시"
                    type="datetime-local"
                    value={formData.event_datetime?.slice(0, 16) || ''}
                    onChange={(v) => updateField('event_datetime', v)}
                    memoField="event_datetime_memo"
                    memoValue={formData.event_datetime_memo || ''}
                  />
                  <InputField
                    label="행사장소 (홀)"
                    value={formData.event_location || ''}
                    onChange={(v) => updateField('event_location', v)}
                    placeholder="예: 그랜드볼룸 A홀"
                    memoField="event_location_memo"
                    memoValue={formData.event_location_memo || ''}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="피로연장"
                    value={formData.reception_hall || ''}
                    onChange={(v) => updateField('reception_hall', v)}
                    memoField="reception_hall_memo"
                    memoValue={formData.reception_hall_memo || ''}
                  />
                  <InputField
                    label="식사보증인원"
                    type="number"
                    value={formData.guaranteed_guests || ''}
                    onChange={(v) => updateField('guaranteed_guests', parseInt(v) || 0)}
                    placeholder="명"
                    memoField="guaranteed_guests_memo"
                    memoValue={formData.guaranteed_guests_memo || ''}
                  />
                </div>
                <InputField
                  label="식권 갯수"
                  type="number"
                  value={formData.meal_ticket_count || ''}
                  onChange={(v) => updateField('meal_ticket_count', parseInt(v) || 0)}
                  memoField="meal_ticket_memo"
                  memoValue={formData.meal_ticket_memo || ''}
                />
                <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                  <h4 className="font-medium text-blue-800 flex items-center gap-2">
                    <Users size={16} /> 신랑/신부 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.groom_name || ''}
                        onChange={(e) => updateField('groom_name', e.target.value)}
                        placeholder="신랑 이름"
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={formData.groom_contact || ''}
                        onChange={(e) => updateField('groom_contact', e.target.value)}
                        placeholder="신랑 연락처"
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={formData.bride_name || ''}
                        onChange={(e) => updateField('bride_name', e.target.value)}
                        placeholder="신부 이름"
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={formData.bride_contact || ''}
                        onChange={(e) => updateField('bride_contact', e.target.value)}
                        placeholder="신부 연락처"
                        className="w-full px-3 py-2 border border-pink-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <textarea
                    value={formData.couple_info_memo || ''}
                    onChange={(e) => updateField('couple_info_memo', e.target.value)}
                    placeholder="메모"
                    rows={2}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. 식사 관련 */}
          <div className="space-y-3">
            <SectionHeader section="meal" icon={<Utensils size={20} />} title="식사 관련" subtitle="코스, 요금, 주류" />
            {expandedSections.has('meal') && (
              <div className="pl-4 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
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
                  memoField="meal_course_memo"
                  memoValue={formData.meal_course_memo || ''}
                />
                <div className="p-4 bg-amber-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-amber-800">주류 서비스</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.alcohol_service_included || false}
                        onChange={(e) => updateField('alcohol_service_included', e.target.checked)}
                        className="w-4 h-4 text-amber-600 rounded"
                      />
                      <span className="text-sm text-amber-700">무료 제공</span>
                    </label>
                  </div>
                  {!formData.alcohol_service_included && (
                    <InputField
                      label="주류 서비스 가격"
                      type="number"
                      value={formData.alcohol_service_price || ''}
                      onChange={(v) => updateField('alcohol_service_price', parseInt(v) || 0)}
                      placeholder="원"
                    />
                  )}
                  <textarea
                    value={formData.alcohol_service_memo || ''}
                    onChange={(e) => updateField('alcohol_service_memo', e.target.value)}
                    placeholder="주류 관련 메모 (종류, 수량 등)"
                    rows={2}
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. 대관 관련 */}
          <div className="space-y-3">
            <SectionHeader section="rental" icon={<Building size={20} />} title="대관 관련" subtitle="홀대관료, 장비, 폐백" />
            {expandedSections.has('rental') && (
              <div className="pl-4 space-y-4 animate-fade-in">
                {/* 홀대관료 */}
                <div className="p-4 bg-stone-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-stone-800">홀대관료</h4>
                    <StatusBadge
                      status={formData.hall_rental_fee_status || 'pending'}
                      onToggle={() => updateField('hall_rental_fee_status', 
                        formData.hall_rental_fee_status === 'completed' ? 'pending' : 'completed')}
                    />
                  </div>
                  <InputField
                    label="금액"
                    type="number"
                    value={formData.hall_rental_fee || ''}
                    onChange={(v) => updateField('hall_rental_fee', parseInt(v) || 0)}
                    memoField="hall_rental_fee_memo"
                    memoValue={formData.hall_rental_fee_memo || ''}
                  />
                </div>

                {/* 혼구용품 */}
                <div className="p-4 bg-stone-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-stone-800">혼구용품</h4>
                    <StatusBadge
                      status={formData.wedding_supplies_status || 'pending'}
                      onToggle={() => updateField('wedding_supplies_status',
                        formData.wedding_supplies_status === 'completed' ? 'pending' : 'completed')}
                    />
                  </div>
                  <InputField
                    label="내용"
                    value={formData.wedding_supplies || ''}
                    onChange={(v) => updateField('wedding_supplies', v)}
                    placeholder="예: 촛대, 꽃장식 등"
                  />
                  <InputField
                    label="금액"
                    type="number"
                    value={formData.wedding_supplies_fee || ''}
                    onChange={(v) => updateField('wedding_supplies_fee', parseInt(v) || 0)}
                    memoField="wedding_supplies_memo"
                    memoValue={formData.wedding_supplies_memo || ''}
                  />
                </div>

                {/* 예식장비 */}
                <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-purple-800">예식장비</h4>
                    <StatusBadge
                      status={formData.equipment_status || 'pending'}
                      onToggle={() => updateField('equipment_status',
                        formData.equipment_status === 'completed' ? 'pending' : 'completed')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'lighting', label: '조명/영상연출', feeKey: 'equipment_lighting_fee', memoKey: 'equipment_lighting_memo' },
                      { key: 'video', label: '영상연출', feeKey: 'equipment_video_fee', memoKey: 'equipment_video_memo' },
                      { key: 'bgm', label: 'BGM', feeKey: 'equipment_bgm_fee', memoKey: 'equipment_bgm_memo' },
                      { key: 'confetti', label: '축포', feeKey: 'equipment_confetti_fee', memoKey: 'equipment_confetti_memo' },
                    ].map(item => (
                      <div key={item.key} className="p-3 bg-white rounded-lg border border-purple-100">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={(formData as any)[`equipment_${item.key}`] || false}
                            onChange={(e) => updateField(`equipment_${item.key}` as keyof ContractInput, e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm font-medium text-purple-800">{item.label}</span>
                        </label>
                        {(formData as any)[`equipment_${item.key}`] && (
                          <>
                            <input
                              type="number"
                              value={(formData as any)[item.feeKey] || ''}
                              onChange={(e) => updateField(item.feeKey as keyof ContractInput, parseInt(e.target.value) || 0)}
                              placeholder="금액"
                              className="w-full px-2 py-1.5 border border-purple-200 rounded text-sm mb-1"
                            />
                            <input
                              type="text"
                              value={(formData as any)[item.memoKey] || ''}
                              onChange={(e) => updateField(item.memoKey as keyof ContractInput, e.target.value)}
                              placeholder="메모"
                              className="w-full px-2 py-1.5 border border-purple-200 rounded text-sm"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 폐백 */}
                <div className="p-4 bg-rose-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-rose-800">폐백 진행</h4>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pyebaek_included || false}
                          onChange={(e) => updateField('pyebaek_included', e.target.checked)}
                          className="w-4 h-4 text-rose-600 rounded"
                        />
                        <span className="text-sm text-rose-700">포함</span>
                      </label>
                      <StatusBadge
                        status={formData.pyebaek_status || 'pending'}
                        onToggle={() => updateField('pyebaek_status',
                          formData.pyebaek_status === 'completed' ? 'pending' : 'completed')}
                      />
                    </div>
                  </div>
                  <InputField
                    label="폐백 비용"
                    type="number"
                    value={formData.pyebaek_fee || ''}
                    onChange={(v) => updateField('pyebaek_fee', parseInt(v) || 0)}
                    memoField="pyebaek_memo"
                    memoValue={formData.pyebaek_memo || ''}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. 특전 관련 */}
          <div className="space-y-3">
            <SectionHeader section="benefits" icon={<Gift size={20} />} title="특전 관련" subtitle="웨딩 계약 특전" />
            {expandedSections.has('benefits') && (
              <div className="pl-4 space-y-3 animate-fade-in">
                {[
                  { key: 'hotel_room', label: '호텔룸 제공', memoKey: 'benefit_hotel_room_memo' },
                  { key: 'meals', label: '식사 제공', memoKey: 'benefit_meals_memo' },
                  { key: 'wedding_cake', label: '웨딩 케익', memoKey: 'benefit_wedding_cake_memo' },
                ].map(item => (
                  <div key={item.key} className="p-3 bg-green-50 rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={(formData as any)[`benefit_${item.key}`] || false}
                        onChange={(e) => updateField(`benefit_${item.key}` as keyof ContractInput, e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="font-medium text-green-800">{item.label}</span>
                    </label>
                    {(formData as any)[`benefit_${item.key}`] && (
                      <textarea
                        value={(formData as any)[item.memoKey] || ''}
                        onChange={(e) => updateField(item.memoKey as keyof ContractInput, e.target.value)}
                        placeholder="상세 내용 (수량, 조건 등)"
                        rows={2}
                        className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm resize-none"
                      />
                    )}
                  </div>
                ))}
                <div className="p-3 bg-green-50 rounded-xl">
                  <label className="block font-medium text-green-800 mb-2">기타 특전</label>
                  <textarea
                    value={formData.benefit_other || ''}
                    onChange={(e) => updateField('benefit_other', e.target.value)}
                    placeholder="기타 특전 내용을 입력하세요"
                    rows={3}
                    className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. 계약 관련 */}
          <div className="space-y-3">
            <SectionHeader section="contract" icon={<FileText size={20} />} title="계약 관련" subtitle="계약금, 변경/위약 조건" />
            {expandedSections.has('contract') && (
              <div className="pl-4 space-y-4 animate-fade-in">
                <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-800">계약금</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.deposit_paid || false}
                        onChange={(e) => updateField('deposit_paid', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-blue-700">납부 완료</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="계약금"
                      type="number"
                      value={formData.deposit_amount || ''}
                      onChange={(v) => updateField('deposit_amount', parseInt(v) || 0)}
                    />
                    {formData.deposit_paid && (
                      <InputField
                        label="납부일"
                        type="date"
                        value={formData.deposit_paid_date || ''}
                        onChange={(v) => updateField('deposit_paid_date', v)}
                      />
                    )}
                  </div>
                  <textarea
                    value={formData.deposit_memo || ''}
                    onChange={(e) => updateField('deposit_memo', e.target.value)}
                    placeholder="계약금 관련 메모"
                    rows={2}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="p-4 bg-amber-50 rounded-xl space-y-3">
                  <h4 className="font-medium text-amber-800 flex items-center gap-2">
                    <AlertCircle size={16} /> 변경/위약 조건
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-amber-700 mb-1 block">날짜 변경 조건</label>
                      <textarea
                        value={formData.date_change_condition || ''}
                        onChange={(e) => updateField('date_change_condition', e.target.value)}
                        placeholder="예: 3개월 전 변경 시 수수료 없음, 1개월 전 변경 시 10% 수수료"
                        rows={2}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-amber-700 mb-1 block">위약금 조건</label>
                      <textarea
                        value={formData.cancellation_penalty || ''}
                        onChange={(e) => updateField('cancellation_penalty', e.target.value)}
                        placeholder="예: 계약 취소 시 계약금 50% 환불"
                        rows={2}
                        className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-stone-700 mb-1 block">계약 관련 기타 메모</label>
                  <textarea
                    value={formData.contract_memo || ''}
                    onChange={(e) => updateField('contract_memo', e.target.value)}
                    placeholder="기타 계약 관련 메모"
                    rows={3}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Save size={18} />
            )}
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueContractForm;
