import React, { useState, useRef } from 'react';
import { Venue, VenueImage } from '../../types';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { X, Calculator, Camera, Star, Trash2, GripVertical, Check, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../src/utils/imageCompression';

interface VenueFormProps {
  initialData?: Venue | null;
  onSubmit: (venue: Venue) => void;
  onCancel: () => void;
}

export const VenueForm: React.FC<VenueFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Venue>>({
    name: '',
    location: '',
    rentalFee: 0,
    mealCostPerPerson: 0,
    minimumGuests: 200,
    sdmIncluded: false,
    studioFee: 0,
    dressFee: 0,
    makeupFee: 0,
    bouquetIncluded: false,
    bouquetFee: 0,
    rehearsalMakeupIncluded: false,
    rehearsalMakeupFee: 0,
    parkingSpaces: 0,
    additionalBenefits: '',
    memo: '',
    rating: 3,
    visitDate: null,
    status: 'pending',
    images: [],
    thumbnailImage: null,
    ...initialData
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Calculate estimated total for preview
  const calculateTotal = () => {
    const rental = Number(formData.rentalFee) || 0;
    const meal = (Number(formData.mealCostPerPerson) || 0) * (Number(formData.minimumGuests) || 0);
    const sdm = (Number(formData.studioFee) || 0) + (Number(formData.dressFee) || 0) + (Number(formData.makeupFee) || 0);
    const bouquet = Number(formData.bouquetFee) || 0;
    const rehearsal = Number(formData.rehearsalMakeupFee) || 0;
    
    return rental + meal + sdm + bouquet + rehearsal;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Remove non-digits
    let rawValue = value.replace(/[^0-9]/g, '');
    if (rawValue.length > 0) {
      rawValue = String(parseInt(rawValue, 10));
      if (isNaN(parseInt(rawValue, 10))) rawValue = '';
    }
    // Parse integer (removes leading zeros automatically)
    const numValue = rawValue === '' ? 0 : parseInt(rawValue, 10);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  // Helper to display formatted number or empty string if 0
  const displayNum = (val: number | undefined) => {
    return val && val > 0 ? val.toLocaleString() : '';
  };

  // --- Image Handling ---

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files) as File[];
    for (const file of fileArray) {
      try {
        // 이미지 압축 (최대 500KB, 1000px) - 여러 이미지 저장을 위해 더 강하게 압축
        const compressedFile = await compressImage(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.7,
          maxSizeMB: 0.5,
        });
        
        console.log(`원본: ${(file.size / 1024 / 1024).toFixed(2)}MB → 압축: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const newImage: VenueImage = {
            id: Math.random().toString(36).substr(2, 9),
            url: reader.result as string,
            caption: '',
            order: (formData.images?.length || 0),
            createdAt: new Date().toISOString()
          };
          
          setFormData(prev => {
            const updatedImages = [...(prev.images || []), newImage];
            // Set first image as thumbnail if none exists
            const thumbnail = prev.thumbnailImage || newImage.id;
            return { ...prev, images: updatedImages, thumbnailImage: thumbnail };
          });
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Image compression failed:', error);
      }
    }
  };

  const handleDeleteImage = (id: string) => {
    setFormData(prev => {
      const updatedImages = prev.images?.filter(img => img.id !== id) || [];
      let thumbnail = prev.thumbnailImage;
      if (thumbnail === id) {
        thumbnail = updatedImages.length > 0 ? updatedImages[0].id : null;
      }
      return { ...prev, images: updatedImages, thumbnailImage: thumbnail };
    });
  };

  const handleSetThumbnail = (id: string) => {
    setFormData(prev => ({ ...prev, thumbnailImage: id }));
  };

  const handleCaptionChange = (id: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map(img => img.id === id ? { ...img, caption } : img)
    }));
  };

  // --- Drag and Drop Logic ---

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === dropIndex) return;

    const newImages = [...(formData.images || [])];
    const draggedItem = newImages[draggedItemIndex];
    
    // Remove dragged item
    newImages.splice(draggedItemIndex, 1);
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedItem);
    
    // Update order property
    const reordered = newImages.map((img, idx) => ({ ...img, order: idx }));

    setFormData(prev => ({ ...prev, images: reordered }));
    setDraggedItemIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const venue: Venue = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: formData.name!,
      location: formData.location!,
      rentalFee: Number(formData.rentalFee),
      sdmIncluded: !!formData.sdmIncluded,
      studioFee: Number(formData.studioFee),
      dressFee: Number(formData.dressFee),
      makeupFee: Number(formData.makeupFee),
      mealCostPerPerson: Number(formData.mealCostPerPerson),
      minimumGuests: Number(formData.minimumGuests),
      bouquetIncluded: !!formData.bouquetIncluded,
      bouquetFee: Number(formData.bouquetFee),
      rehearsalMakeupIncluded: !!formData.rehearsalMakeupIncluded,
      rehearsalMakeupFee: Number(formData.rehearsalMakeupFee),
      parkingSpaces: Number(formData.parkingSpaces),
      additionalBenefits: formData.additionalBenefits || '',
      memo: formData.memo || '',
      rating: Number(formData.rating),
      visitDate: formData.visitDate || null,
      status: formData.status as any,
      images: formData.images || [],
      thumbnailImage: formData.thumbnailImage || null,
    };

    onSubmit(venue);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:items-center md:justify-center p-0 md:p-4 bg-white md:bg-stone-900/60 md:backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-2xl shadow-none md:shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="text-xl font-bold text-stone-800">
            {initialData ? '웨딩홀 수정' : '새 웨딩홀 추가'}
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 md:pb-6">
          
          {/* 0. Image Gallery Management */}
          <section className="space-y-4">
             <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center gap-2">
                   <ImageIcon size={16}/> 웨딩홀 사진
                </h4>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                   <Camera size={16} className="mr-1"/> 사진 추가
                </Button>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   multiple 
                   accept="image/*" 
                   onChange={handleImageUpload} 
                />
             </div>
             
             {formData.images && formData.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {formData.images.map((img, index) => (
                      <div 
                         key={img.id}
                         draggable
                         onDragStart={(e) => handleDragStart(e, index)}
                         onDragOver={(e) => handleDragOver(e, index)}
                         onDrop={(e) => handleDrop(e, index)}
                         className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
                            formData.thumbnailImage === img.id ? 'border-rose-500 ring-2 ring-rose-200' : 'border-stone-200 hover:border-stone-300'
                         } ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
                      >
                         <div className="aspect-[4/3] relative">
                            <img src={img.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                               <button 
                                  type="button"
                                  onClick={() => handleSetThumbnail(img.id)}
                                  title="대표 이미지 설정"
                                  className={`p-2 rounded-full ${formData.thumbnailImage === img.id ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-rose-500'}`}
                               >
                                  <Star size={16} className={formData.thumbnailImage === img.id ? 'fill-white' : ''} />
                               </button>
                               <button 
                                  type="button"
                                  onClick={() => handleDeleteImage(img.id)}
                                  title="삭제"
                                  className="p-2 rounded-full bg-white/20 text-white hover:bg-red-500"
                               >
                                  <Trash2 size={16} />
                               </button>
                            </div>
                            <div className="absolute top-2 left-2 cursor-move md:opacity-0 group-hover:opacity-100 bg-black/30 p-1 rounded text-white">
                               <GripVertical size={14} />
                            </div>
                         </div>
                         <div className="p-2 bg-stone-50">
                            <input 
                               type="text" 
                               value={img.caption} 
                               onChange={(e) => handleCaptionChange(img.id, e.target.value)}
                               placeholder="설명 입력 (예: 로비)"
                               className="w-full bg-transparent text-xs text-stone-600 outline-none border-b border-transparent focus:border-stone-300 pb-0.5"
                            />
                         </div>
                         {formData.thumbnailImage === img.id && (
                            <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm font-bold">
                               대표
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             ) : (
                <div 
                   className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer"
                   onClick={() => fileInputRef.current?.click()}
                >
                   <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-400 flex items-center justify-center mx-auto mb-3">
                      <Camera size={24} />
                   </div>
                   <p className="text-sm text-stone-600 font-medium">사진을 추가해주세요</p>
                   <p className="text-xs text-stone-400 mt-1">드래그하여 순서를 변경할 수 있습니다</p>
                </div>
             )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-8">
                {/* 1. Basic Info */}
                <section>
                  <h4 className="text-sm font-bold text-rose-500 mb-4 uppercase tracking-wider">기본 정보</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">웨딩홀 이름 <span className="text-rose-500">*</span></label>
                      <input required name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none" placeholder="예: 더 채플 앳 논현" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">위치 <span className="text-rose-500">*</span></label>
                      <input required name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all outline-none" placeholder="예: 서울 강남구" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-stone-700">상태</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none bg-white">
                          <option value="pending">방문 예정</option>
                          <option value="visited">방문 완료</option>
                          <option value="contracted">계약 완료</option>
                          <option value="excluded">후보 제외</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <DatePicker
                          label="방문(예정)일"
                          value={formData.visitDate || ''}
                          onChange={(date) => setFormData(prev => ({ ...prev, visitDate: date }))}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Core Costs */}
                <section className="bg-stone-50 p-5 rounded-2xl border border-stone-100">
                  <h4 className="text-sm font-bold text-rose-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Calculator size={16} /> 필수 비용
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">대관료 (원)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        name="rentalFee" 
                        value={displayNum(formData.rentalFee)} 
                        onChange={handleNumberChange} 
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">1인 식대 (원)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        name="mealCostPerPerson" 
                        value={displayNum(formData.mealCostPerPerson)} 
                        onChange={handleNumberChange} 
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">보증 인원 (명)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        name="minimumGuests" 
                        value={displayNum(formData.minimumGuests)} 
                        onChange={handleNumberChange} 
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">주차 가능 (대)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        name="parkingSpaces" 
                        value={displayNum(formData.parkingSpaces)} 
                        onChange={handleNumberChange} 
                        className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
                        placeholder="0"
                      />
                    </div>
                  </div>
                </section>
             </div>

             <div className="space-y-8">
                {/* 3. Additional Options */}
                <section>
                  <h4 className="text-sm font-bold text-rose-500 mb-4 uppercase tracking-wider">추가 옵션</h4>
                  <div className="space-y-4">
                    
                    {/* SDM */}
                    <div className="p-4 border border-stone-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-800">스드메 (스튜디오/드레스/메이크업)</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="sdmIncluded" checked={formData.sdmIncluded} onChange={handleChange} className="accent-rose-500 w-4 h-4" />
                          <span className="text-sm text-stone-600">대관료 포함</span>
                        </label>
                      </div>
                      {!formData.sdmIncluded && (
                        <div className="grid grid-cols-3 gap-3 animate-fade-in">
                          <div>
                            <label className="text-xs text-stone-500 block mb-1">스튜디오</label>
                            <input 
                              type="text"
                              inputMode="numeric"
                              name="studioFee" 
                              value={displayNum(formData.studioFee)} 
                              onChange={handleNumberChange} 
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-stone-500 block mb-1">드레스</label>
                            <input 
                              type="text"
                              inputMode="numeric"
                              name="dressFee" 
                              value={displayNum(formData.dressFee)} 
                              onChange={handleNumberChange} 
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" 
                              placeholder="0" 
                            />
                          </div>
                          <div>
                            <label className="text-xs text-stone-500 block mb-1">메이크업</label>
                            <input 
                              type="text"
                              inputMode="numeric"
                              name="makeupFee" 
                              value={displayNum(formData.makeupFee)} 
                              onChange={handleNumberChange} 
                              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm" 
                              placeholder="0" 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bouquet */}
                    <div className="p-4 border border-stone-200 rounded-xl flex items-center justify-between">
                      <div>
                         <span className="font-medium text-stone-800 block">부케</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="bouquetIncluded" checked={formData.bouquetIncluded} onChange={handleChange} className="accent-rose-500 w-4 h-4" />
                          <span className="text-sm text-stone-600">포함</span>
                        </label>
                        {!formData.bouquetIncluded && (
                          <input 
                            type="text"
                            inputMode="numeric"
                            name="bouquetFee" 
                            value={displayNum(formData.bouquetFee)} 
                            onChange={handleNumberChange} 
                            className="w-32 px-3 py-2 rounded-lg border border-stone-200 text-sm" 
                            placeholder="비용 입력" 
                          />
                        )}
                      </div>
                    </div>

                    {/* Rehearsal Makeup */}
                    <div className="p-4 border border-stone-200 rounded-xl flex items-center justify-between">
                      <div>
                         <span className="font-medium text-stone-800 block">리허설 메이크업</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name="rehearsalMakeupIncluded" checked={formData.rehearsalMakeupIncluded} onChange={handleChange} className="accent-rose-500 w-4 h-4" />
                          <span className="text-sm text-stone-600">포함</span>
                        </label>
                        {!formData.rehearsalMakeupIncluded && (
                          <input 
                            type="text"
                            inputMode="numeric"
                            name="rehearsalMakeupFee" 
                            value={displayNum(formData.rehearsalMakeupFee)} 
                            onChange={handleNumberChange} 
                            className="w-32 px-3 py-2 rounded-lg border border-stone-200 text-sm" 
                            placeholder="비용 입력" 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Detail Info */}
                <section>
                  <h4 className="text-sm font-bold text-rose-500 mb-4 uppercase tracking-wider">상세 정보</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">부가 혜택</label>
                      <textarea name="additionalBenefits" value={formData.additionalBenefits} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none" placeholder="예: 포토테이블, 플라워 샤워 서비스 등" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">메모</label>
                      <textarea name="memo" value={formData.memo} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none" placeholder="방문 후기나 특이사항을 기록하세요" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-stone-700">내 별점 (5점 만점)</label>
                      <div className="flex gap-4 items-center">
                         <input type="range" name="rating" min="1" max="5" step="0.5" value={formData.rating} onChange={handleChange} className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                         <span className="font-bold text-lg w-8 text-center">{formData.rating}</span>
                      </div>
                    </div>
                  </div>
                </section>
             </div>
          </div>
        </form>

        <div className="bg-stone-900 text-white p-4 flex justify-between items-center shrink-0 shadow-lg md:rounded-b-none z-10">
             <span className="text-sm text-stone-300">총 예상 견적</span>
             <span className="text-xl font-bold">
               {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(calculateTotal())}
             </span>
        </div>

        <div className="p-4 border-t border-stone-100 flex gap-3 bg-white shrink-0 safe-area-pb">
          <Button variant="outline" className="flex-1" onClick={onCancel}>취소</Button>
          <Button variant="primary" className="flex-1" onClick={handleSubmit}>
            {initialData ? '수정 완료' : '등록하기'}
          </Button>
        </div>
      </div>
    </div>
  );
};
