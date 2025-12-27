
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Venue } from '../../types';
import { MapPin, Star, Minus, Check, Edit2, Trash2, Image as ImageIcon, Plus, MoreVertical } from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from '../../src/components/common/EmptyState';

interface VenueCalculated extends Venue {
  totalEstimate: number;
}

interface VenueCardDeckProps {
  venues: VenueCalculated[];
  onEdit: (venue: Venue) => void;
  onDelete: (id: string) => void;
  onOpenGallery: (venue: Venue) => void;
  onAdd: () => void;
  isSelectMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export const VenueCardDeck: React.FC<VenueCardDeckProps> = ({ 
  venues, 
  onEdit, 
  onDelete, 
  onOpenGallery,
  onAdd,
  isSelectMode = false,
  selectedIds = new Set(),
  onToggleSelect
}) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when navigating between cards
  useEffect(() => {
    setIsMenuOpen(false);
  }, [page]);

  // Handle empty state
  if (venues.length === 0) {
    return (
      <EmptyState
        illustration="venue"
        title="아직 등록된 웨딩홀이 없어요"
        description="관심 있는 웨딩홀을 등록하고 비교해보세요. 여러 식장을 한눈에 비교할 수 있어요!"
        actionLabel="새 웨딩홀 추가"
        onAction={onAdd}
      />
    );
  }

  const venueIndex = Math.abs(page % venues.length);
  const currentVenue = venues[venueIndex];
  const thumbUrl = currentVenue.images && currentVenue.images.length > 0 
    ? (currentVenue.images.find(img => img.id === currentVenue.thumbnailImage)?.url || currentVenue.images[0].url) 
    : null;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
      zIndex: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  // Improved Swipe Logic
  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo) => {
    // If menu is open, don't allow swipe, or close menu? 
    // Usually preventing swipe is better UX or swipe closes menu.
    // Here we let the backdrop handle menu closing, but we should prevent page change if menu was just interacted with.
    if (isMenuOpen) return;

    const swipeThreshold = 50; // px
    const velocityThreshold = 200; // px/s

    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      // Swiped Left -> Next
      paginate(1);
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      // Swiped Right -> Prev
      paginate(-1);
    }
  };

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="relative w-full h-[calc(100vh-200px)] min-h-[520px] max-h-[700px] flex flex-col items-center justify-start overflow-hidden">
      
      {/* Select Mode Banner */}
      {isSelectMode && (
        <div className="w-full bg-rose-500 text-white text-center py-2 px-4 text-sm font-medium mb-2 rounded-lg mx-4" style={{ width: 'calc(100% - 32px)' }}>
          비교할 웨딩홀을 선택하세요 (최대 6개)
        </div>
      )}

      {/* Top Indicators */}
      <div className="w-full flex justify-between items-center px-4 mb-4 z-10">
        <div className="text-sm font-bold text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
           {venueIndex + 1} / {venues.length}
        </div>
        <div className="flex gap-1">
           {venues.map((_: VenueCalculated, idx: number) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === venueIndex ? 'bg-rose-500 w-3' : 'bg-stone-300'}`}
              />
           ))}
        </div>
      </div>

      {/* Card Area */}
      <div className="relative w-full flex-1 max-w-md perspective-1000">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute w-full h-full px-4 pb-4 cursor-grab active:cursor-grabbing touch-pan-y"
            style={{ touchAction: "pan-y" }}
          >
            <div className="w-full h-full bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden flex flex-col relative select-none">
              
              {/* Menu Backdrop */}
              {isMenuOpen && (
                <div 
                  className="absolute inset-0 z-40" 
                  onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }}
                />
              )}

              {/* Selection Overlay for Compare Mode */}
              {isSelectMode && (
                <div 
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 cursor-pointer"
                  onClick={(e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    onToggleSelect?.(currentVenue.id); 
                  }}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    selectedIds.has(currentVenue.id) 
                      ? 'bg-rose-500 text-white scale-110' 
                      : 'bg-white/90 text-stone-400 border-2 border-stone-300'
                  }`}>
                    {selectedIds.has(currentVenue.id) ? (
                      <Check size={32} strokeWidth={3} />
                    ) : (
                      <Plus size={32} />
                    )}
                  </div>
                </div>
              )}

              {/* Selection Badge */}
              {isSelectMode && selectedIds.has(currentVenue.id) && (
                <div className="absolute top-3 left-3 z-40 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  선택됨 ✓
                </div>
              )}

              {/* Top Image Section (35%) */}
              <div 
                className="h-[35%] min-h-[140px] max-h-[200px] bg-stone-200 relative shrink-0 cursor-pointer group"
                onClick={() => {
                  if (!isMenuOpen && !isSelectMode) onOpenGallery(currentVenue);
                  if (isSelectMode) onToggleSelect?.(currentVenue.id);
                }}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt={`${currentVenue.name} 웨딩홀 사진`} loading="lazy" className="w-full h-full object-cover pointer-events-none" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100" role="img" aria-label={`${currentVenue.name} - 사진 없음`}>
                    <ImageIcon size={32} className="mb-2 opacity-50" aria-hidden="true" />
                    <span className="text-xs">사진 없음</span>
                  </div>
                )}
                
                {/* Image Overlay Info (Left) */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/40 to-transparent h-20 pointer-events-none">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shadow-sm text-white ${
                    currentVenue.status === 'visited' ? 'bg-green-500' :
                    currentVenue.status === 'contracted' ? 'bg-rose-500' :
                    currentVenue.status === 'excluded' ? 'bg-stone-500' :
                    'bg-blue-500'
                  }`}>
                    {currentVenue.status === 'visited' ? '방문완료' : 
                     currentVenue.status === 'contracted' ? '계약완료' : 
                     currentVenue.status === 'excluded' ? '제외됨' : '방문예정'}
                  </span>
                </div>

                {/* More Action Menu (Right) */}
                <div className="absolute top-3 right-3 z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                    className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-sm transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-11 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden min-w-[140px] flex flex-col origin-top-right"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onEdit(currentVenue); }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 text-left w-full border-b border-stone-50 active:bg-stone-100"
                        >
                          <Edit2 size={16} className="text-stone-500"/> 수정하기
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onDelete(currentVenue.id); }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left w-full active:bg-red-50"
                        >
                          <Trash2 size={16} /> 삭제하기
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 pointer-events-none">
                   <ImageIcon size={10}/> {currentVenue.images?.length || 0}장
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto">
                <div>
                   <div className="flex justify-between items-start mb-1">
                      <h2 className="text-xl font-bold text-stone-800 leading-tight line-clamp-1">{currentVenue.name}</h2>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg shrink-0 ml-2">
                        <Star size={12} className="fill-yellow-400 text-yellow-400"/>
                        <span className="text-xs font-bold text-yellow-700">{currentVenue.rating}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-1 text-stone-500 text-xs mb-3">
                      <MapPin size={12} />
                      <span className="line-clamp-1">{currentVenue.location}</span>
                   </div>

                   {/* Key Metrics Grid */}
                   <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-stone-50 p-2.5 rounded-xl">
                         <span className="text-[10px] text-stone-400 block mb-0.5">대관료</span>
                         <span className="text-xs font-bold text-stone-700">{formatMoney(currentVenue.rentalFee)}</span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-xl">
                         <span className="text-[10px] text-stone-400 block mb-0.5">1인 식대</span>
                         <span className="text-xs font-bold text-stone-700">{formatMoney(currentVenue.mealCostPerPerson)}</span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-xl">
                         <span className="text-[10px] text-stone-400 block mb-0.5">스드메</span>
                         <span className={`text-xs font-bold flex items-center gap-1 ${currentVenue.sdmIncluded ? 'text-green-600' : 'text-stone-500'}`}>
                           {currentVenue.sdmIncluded ? <><Check size={12}/> 포함</> : <><Minus size={12}/> 별도</>}
                         </span>
                      </div>
                      <div className="bg-stone-50 p-2.5 rounded-xl">
                         <span className="text-[10px] text-stone-400 block mb-0.5">보증인원</span>
                         <span className="text-xs font-bold text-stone-700">{currentVenue.minimumGuests}명</span>
                      </div>
                   </div>
                </div>

                {/* Bottom Highlight - Total Cost */}
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex justify-between items-center shadow-[0_4px_12px_-4px_rgba(244,63,94,0.2)] mt-auto">
                  <div>
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">예상 총비용</p>
                      <p className="text-[9px] text-rose-300 mt-0.5">({currentVenue.minimumGuests}명 기준)</p>
                  </div>
                  <p className="text-xl font-bold text-rose-600">{formatMoney(currentVenue.totalEstimate)}</p>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};
