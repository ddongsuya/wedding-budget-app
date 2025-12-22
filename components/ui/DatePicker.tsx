import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value: string | null;
  onChange: (date: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, value, onChange, required, className = '', placeholder = '날짜 선택' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'year' | 'month' | 'day'>('day');
  const [viewDate, setViewDate] = useState(new Date());
  
  // Ref for year scroll
  const yearListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (value) {
        setViewDate(new Date(value));
        setStep('day'); 
      } else {
        setViewDate(new Date());
        setStep('year'); // Start with year if no date selected
      }
    }
  }, [isOpen, value]);

  // Scroll to selected year when year view opens
  useEffect(() => {
    if (isOpen && step === 'year' && yearListRef.current) {
        const selectedYearEl = yearListRef.current.querySelector('[data-selected="true"]');
        if (selectedYearEl) {
            selectedYearEl.scrollIntoView({ block: 'center' });
        }
    }
  }, [isOpen, step]);

  const handleYearSelect = (year: number) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setStep('month');
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(month);
    setViewDate(newDate);
    setStep('day'); // Logic fix: Proceed to Day selection
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const generateCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const calendar = [];
    for(let i=0; i<firstDay; i++) calendar.push(null);
    for(let i=1; i<=daysInMonth; i++) calendar.push(i);
    return calendar;
  };

  const generateYearRange = useCallback(() => {
    const years = [];
    // Generate a wide range of years for birthdays and future planning
    for(let i = 1960; i <= 2040; i++) years.push(i);
    return years;
  }, []);

  return (
    <div className={className}>
       {label && <label htmlFor={`datepicker-${label}`} className="text-sm font-medium text-stone-700 flex items-center gap-1.5 mb-1.5">{label} {required && <span className="text-rose-500" aria-hidden="true">*</span>}{required && <span className="sr-only">(필수)</span>}</label>}
       <div 
         id={`datepicker-${label}`}
         onClick={() => setIsOpen(true)}
         className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between cursor-pointer hover:border-rose-300 focus:ring-2 focus:ring-rose-500/20 transition-all"
         role="button"
         tabIndex={0}
         aria-label={`${label || '날짜'} 선택${value ? `: ${value}` : ''}`}
         aria-haspopup="dialog"
         aria-expanded={isOpen}
         onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(true); } }}
       >
          <span className={value ? 'text-stone-800' : 'text-stone-400'}>
            {value || placeholder}
          </span>
          <Calendar size={18} className="text-stone-400" aria-hidden="true" />
       </div>

       {isOpen && (
         <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} role="dialog" aria-modal="true" aria-label="날짜 선택">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               {/* Header */}
               <div className="bg-rose-500 p-5 text-white flex justify-between items-start shrink-0">
                  <div className="flex flex-col">
                    <button 
                        onClick={() => setStep('year')} 
                        className={`text-sm font-medium text-left opacity-80 hover:opacity-100 transition-opacity ${step === 'year' ? 'underline underline-offset-4 decoration-2' : ''}`}
                        aria-label={`${viewDate.getFullYear()}년 선택`}
                        aria-current={step === 'year' ? 'step' : undefined}
                    >
                        {viewDate.getFullYear()}년
                    </button>
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={() => setStep('month')} 
                            className={`text-3xl font-bold hover:opacity-80 transition-opacity ${step === 'month' ? 'underline underline-offset-8 decoration-2' : ''}`}
                            aria-label={`${viewDate.getMonth() + 1}월 선택`}
                            aria-current={step === 'month' ? 'step' : undefined}
                        >
                           {viewDate.getMonth() + 1}월
                        </button>
                        <button 
                             onClick={() => setStep('day')}
                             className={`text-3xl font-bold hover:opacity-80 transition-opacity ${step === 'day' ? 'underline underline-offset-8 decoration-2' : ''}`}
                             aria-label={`${viewDate.getDate()}일 선택`}
                             aria-current={step === 'day' ? 'step' : undefined}
                        > 
                           {viewDate.getDate()}일
                        </button>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/20 rounded-full transition-colors touch-feedback" aria-label="닫기"><X size={24} aria-hidden="true" /></button>
               </div>
               
               {/* Body */}
               <div className="p-4 h-[340px] flex flex-col">
                  {step === 'day' && (
                     // Calendar View
                     <div className="flex-1 flex flex-col animate-slide-up" role="grid" aria-label="달력">
                        <div className="flex justify-between items-center mb-4 px-2">
                           <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewDate(d); }} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-600 touch-feedback" aria-label="이전 달"><ChevronLeft size={20} aria-hidden="true" /></button>
                           <button onClick={() => setStep('month')} className="font-bold text-stone-800 hover:text-rose-500 text-lg min-h-[44px] px-2 flex items-center" aria-label={`${viewDate.getFullYear()}년 ${viewDate.getMonth() + 1}월, 클릭하여 월 선택`}>{viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월</button>
                           <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewDate(d); }} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-600 touch-feedback" aria-label="다음 달"><ChevronRight size={20} aria-hidden="true" /></button>
                        </div>
                        <div className="grid grid-cols-7 text-center text-xs font-medium text-stone-400 mb-2" role="row">
                           {['일','월','화','수','목','금','토'].map((d, i) => <span key={d} className={i === 0 ? 'text-rose-400' : ''} role="columnheader">{d}</span>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 flex-1 content-start" role="rowgroup">
                           {generateCalendar(viewDate).map((day, i) => (
                              <button 
                                key={i} 
                                disabled={!day}
                                onClick={() => day && handleDaySelect(day)}
                                className={`h-10 w-10 min-w-[40px] min-h-[40px] rounded-full text-sm flex items-center justify-center transition-all touch-feedback ${
                                   !day ? 'invisible' : 
                                   (day === viewDate.getDate() && value?.endsWith(`${String(day).padStart(2,'0')}`)) 
                                   ? 'bg-rose-500 text-white font-bold shadow-md transform scale-105' 
                                   : 'hover:bg-stone-100 text-stone-700 active:scale-95'
                                }`}
                                aria-label={day ? `${viewDate.getMonth() + 1}월 ${day}일` : undefined}
                                aria-selected={day === viewDate.getDate() && value?.endsWith(`${String(day).padStart(2,'0')}`)}
                                role="gridcell"
                              >
                                {day}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}
                  {step === 'month' && (
                     // Month Grid
                     <div className="flex-1 flex flex-col animate-slide-up" role="listbox" aria-label="월 선택">
                       <div className="flex justify-between items-center mb-6 px-2">
                          <button onClick={() => handleYearSelect(viewDate.getFullYear() - 1)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-600 touch-feedback" aria-label="이전 년도"><ChevronLeft size={20} aria-hidden="true" /></button>
                          <button onClick={() => setStep('year')} className="font-bold text-stone-800 hover:text-rose-500 text-lg mx-auto min-h-[44px] px-2 flex items-center" aria-label={`${viewDate.getFullYear()}년, 클릭하여 년도 선택`}>{viewDate.getFullYear()}년</button>
                          <button onClick={() => handleYearSelect(viewDate.getFullYear() + 1)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 rounded-full text-stone-600 touch-feedback" aria-label="다음 년도"><ChevronRight size={20} aria-hidden="true" /></button>
                       </div>
                       <div className="grid grid-cols-3 gap-4 content-center flex-1">
                          {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                             <button 
                               key={m}
                               onClick={() => handleMonthSelect(m - 1)}
                               className={`py-3 min-h-[44px] rounded-2xl text-sm font-semibold transition-all touch-feedback ${viewDate.getMonth() + 1 === m ? 'bg-rose-500 text-white shadow-md transform scale-105' : 'bg-stone-50 hover:bg-stone-100 text-stone-600'}`}
                               role="option"
                               aria-selected={viewDate.getMonth() + 1 === m}
                               aria-label={`${m}월`}
                             >
                               {m}월
                             </button>
                          ))}
                       </div>
                     </div>
                  )}
                  {step === 'year' && (
                     // Year List
                     <div ref={yearListRef} className="overflow-y-auto h-full grid grid-cols-3 gap-3 content-start pr-1 scrollbar-hide animate-slide-up" role="listbox" aria-label="년도 선택">
                        {generateYearRange().map(y => (
                           <button 
                              key={y}
                              data-selected={viewDate.getFullYear() === y}
                              onClick={() => handleYearSelect(y)}
                              className={`py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-all touch-feedback ${viewDate.getFullYear() === y ? 'bg-rose-500 text-white shadow-md transform scale-105' : 'bg-stone-50 hover:bg-stone-100 text-stone-600'}`}
                              role="option"
                              aria-selected={viewDate.getFullYear() === y}
                              aria-label={`${y}년`}
                           >
                              {y}
                           </button>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
       )}
    </div>
  );
};