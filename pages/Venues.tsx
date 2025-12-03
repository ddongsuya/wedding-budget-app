import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { Venue, ViewMode } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { VenueForm } from '../components/venue/VenueForm';
import { VenueCompare } from '../components/venue/VenueCompare';
import { VenueCardDeck } from '../components/venue/VenueCardDeck';
import { BottomSheet } from '../components/ui/BottomSheet';
import { GalleryViewer } from '../components/ui/GalleryViewer';
import { Plus, MapPin, Star, Car, LayoutGrid, List, Search, ArrowUpDown, Filter, CheckSquare, Square, X, Image as ImageIcon, Check, Minus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useToast } from '../src/hooks/useToast';

type SortKey = 'rating' | 'price' | 'createdAt' | 'minGuests';
type FilterStatus = 'all' | 'visited' | 'pending' | 'contracted';
type SdmFilter = 'all' | 'included' | 'excluded';

interface VenueCalculated extends Venue {
  totalEstimate: number;
}

export const Venues: React.FC = () => {
  const { toast } = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

  // Gallery Viewer State
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedVenueForGallery, setSelectedVenueForGallery] = useState<Venue | null>(null);

  // Comparison State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filter & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sdmFilter, setSdmFilter] = useState<SdmFilter>('all');
  const [locationFilter, setLocationFilter] = useState('');
  
  // Mobile Filter Sheet
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const location = useLocation();

  useEffect(() => {
    setVenues(StorageService.getVenues());
    
    const handleResize = () => {
      // If mobile, force card view. If desktop, use table as default but allow toggle
      if (window.innerWidth < 1024) {
        setViewMode('card');
      } else {
        setViewMode('table');
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle opening form from FAB (via router state)
  useEffect(() => {
    if (location.state && (location.state as any).openAdd) {
       setEditingVenue(null);
       setIsFormOpen(true);
       // Clear the state so it doesn't reopen on refresh if we could, 
       // but React Router state persists on refresh usually.
       // We can consume it.
       window.history.replaceState({}, document.title);
    }
  }, [location]);

  const formatMoney = (amount: number) => 
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);

  const calculateTotalEstimate = (venue: Venue) => {
    let total = venue.rentalFee + (venue.mealCostPerPerson * venue.minimumGuests);
    if (!venue.sdmIncluded) total += (venue.studioFee + venue.dressFee + venue.makeupFee);
    if (!venue.bouquetIncluded) total += venue.bouquetFee;
    if (!venue.rehearsalMakeupIncluded) total += venue.rehearsalMakeupFee;
    return total;
  };

  const handleSaveVenue = (venue: Venue) => {
    try {
      if (editingVenue) {
        const updated = StorageService.updateVenue(venue);
        setVenues(updated);
        toast.success('식장 정보가 수정되었습니다');
      } else {
        const updated = StorageService.addVenue(venue);
        setVenues(updated);
        toast.success('식장이 추가되었습니다');
      }
      setIsFormOpen(false);
      setEditingVenue(null);
    } catch (error) {
      toast.error('저장에 실패했습니다');
    }
  };

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        const updated = StorageService.deleteVenue(id);
        setVenues(updated);
        // Remove from selection if exists
        if (selectedIds.has(id)) {
          const newSet = new Set(selectedIds);
          newSet.delete(id);
          setSelectedIds(newSet);
        }
        toast.success('식장이 삭제되었습니다');
      } catch (error) {
        toast.error('삭제에 실패했습니다');
      }
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size >= 4) {
        alert('비교는 최대 4개까지만 가능합니다.');
        return;
      }
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const openGallery = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      setSelectedVenueForGallery(venue);
      setGalleryOpen(true);
    }
  };

  const getThumbnailUrl = (venue: Venue) => {
    if (!venue.images || venue.images.length === 0) return null;
    const thumbnail = venue.images.find(img => img.id === venue.thumbnailImage) || venue.images[0];
    return thumbnail.url;
  };

  // Derived Data: Filtered & Sorted
  const processedVenues: VenueCalculated[] = venues
    .map(v => ({ ...v, totalEstimate: calculateTotalEstimate(v) }))
    .filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            v.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesSdm = sdmFilter === 'all' || (sdmFilter === 'included' ? v.sdmIncluded : !v.sdmIncluded);
      const matchesLocation = locationFilter === '' || v.location.includes(locationFilter);

      return matchesSearch && matchesStatus && matchesSdm && matchesLocation;
    })
    .sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'price') {
        valA = a.totalEstimate;
        valB = b.totalEstimate;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc'); // Default to high-low for new sort
    }
  };

  const uniqueLocations = Array.from(new Set(venues.map(v => v.location.split(' ')[0])));

  return (
    <div className="space-y-6 pb-24 md:pb-0 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">웨딩홀 비교</h2>
            <p className="text-stone-500 text-sm mt-1">
              등록된 <span className="text-rose-500 font-bold">{venues.length}</span>개의 웨딩홀을 비교 분석하세요.
            </p>
          </div>
          <Button icon={<Plus size={18} />} onClick={() => { setEditingVenue(null); setIsFormOpen(true); }} className="hidden md:flex">
            추가
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl border border-stone-200 shadow-sm items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text" 
              placeholder="웨딩홀 검색" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 outline-none"
            />
          </div>
          
          {/* Desktop Filters */}
          <div className="hidden md:flex gap-2 items-center">
            <select 
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 rounded-lg text-sm border-none outline-none text-stone-600 cursor-pointer hover:bg-stone-100"
            >
              <option value="">모든 지역</option>
              {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="px-3 py-2 bg-stone-50 rounded-lg text-sm border-none outline-none text-stone-600 cursor-pointer hover:bg-stone-100"
            >
              <option value="all">모든 상태</option>
              <option value="pending">방문 예정</option>
              <option value="visited">방문 완료</option>
              <option value="contracted">계약 완료</option>
            </select>

            <div className="h-6 w-px bg-stone-200 mx-1"></div>

            <button 
              onClick={() => toggleSort('price')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${sortBy === 'price' ? 'bg-rose-50 text-rose-600 font-medium' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
            >
              예상견적순
              {sortBy === 'price' && <ArrowUpDown size={14} />}
            </button>
             <button 
              onClick={() => toggleSort('rating')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${sortBy === 'rating' ? 'bg-rose-50 text-rose-600 font-medium' : 'bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
            >
              별점순
              {sortBy === 'rating' && <ArrowUpDown size={14} />}
            </button>
          </div>

          {/* Mobile Filter Trigger */}
          <button 
            className="md:hidden p-2 bg-stone-50 rounded-lg text-stone-600 hover:bg-stone-100 relative"
            onClick={() => setIsFilterSheetOpen(true)}
          >
            <Filter size={20} />
            {(locationFilter || statusFilter !== 'all' || sdmFilter !== 'all') && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      
      {/* Mobile Card Deck View */}
      <div className="md:hidden">
         <VenueCardDeck 
            venues={processedVenues}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenGallery={openGallery}
            onAdd={() => { setEditingVenue(null); setIsFormOpen(true); }}
         />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden">
        {processedVenues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 bg-white rounded-2xl border border-stone-200 border-dashed">
             <LayoutGrid size={48} className="mb-4 opacity-20" />
             <p className="text-lg font-medium">검색 결과가 없습니다</p>
             <p className="text-sm">조건을 변경하거나 새로운 웨딩홀을 등록해주세요.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-stone-50 text-stone-600 font-medium border-b border-stone-200">
                <tr>
                  <th className="px-4 py-4 w-10 text-center">
                    <span className="sr-only">선택</span>
                  </th>
                  <th className="px-6 py-4 w-20 text-center">사진</th>
                  <th className="px-6 py-4 sticky left-0 bg-stone-50 z-10">웨딩홀</th>
                  <th className="px-6 py-4">위치</th>
                  <th className="px-6 py-4 text-right">대관료</th>
                  <th className="px-6 py-4 text-right">1인 식대</th>
                  <th className="px-6 py-4 text-center">보증인원</th>
                  <th className="px-6 py-4 text-center">스드메</th>
                  <th className="px-6 py-4 text-center">별점</th>
                  <th className="px-6 py-4 text-right font-bold text-stone-800 bg-rose-50/30">총 예상 견적</th>
                  <th className="px-6 py-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {processedVenues.map((venue) => {
                  const thumbUrl = getThumbnailUrl(venue);
                  return (
                    <tr 
                      key={venue.id} 
                      className={`hover:bg-stone-50 transition-colors group ${selectedIds.has(venue.id) ? 'bg-rose-50/30' : ''}`}
                      onClick={() => toggleSelection(venue.id)}
                    >
                      <td className="px-4 py-4 text-center">
                        <div 
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer mx-auto ${selectedIds.has(venue.id) ? 'bg-rose-500 border-rose-500' : 'bg-white border-stone-300'}`}
                        >
                          {selectedIds.has(venue.id) && <CheckSquare size={14} className="text-white" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div 
                            className="w-12 h-12 rounded-lg bg-stone-100 overflow-hidden cursor-pointer border border-stone-200 mx-auto"
                            onClick={(e) => { e.stopPropagation(); openGallery(venue); }}
                         >
                            {thumbUrl ? (
                              <img src={thumbUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">
                                 <ImageIcon size={16} />
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-stone-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div>
                          <p className="font-bold text-stone-800">{venue.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            venue.status === 'contracted' ? 'bg-rose-100 text-rose-700' : 
                            venue.status === 'visited' ? 'bg-green-100 text-green-700' : 
                            venue.status === 'excluded' ? 'bg-stone-100 text-stone-400 line-through' :
                            'bg-stone-100 text-stone-500'
                          }`}>
                            {venue.status === 'contracted' ? '계약완료' : venue.status === 'visited' ? '방문완료' : venue.status === 'excluded' ? '제외됨' : '방문예정'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-stone-600">{venue.location}</td>
                      <td className="px-6 py-4 text-stone-600 text-right">{formatMoney(venue.rentalFee)}</td>
                      <td className="px-6 py-4 text-stone-600 text-right">{formatMoney(venue.mealCostPerPerson)}</td>
                      <td className="px-6 py-4 text-stone-600 text-center">{venue.minimumGuests}명</td>
                      <td className="px-6 py-4 text-center">
                        {venue.sdmIncluded ? 
                          <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">포함</span> : 
                          <span className="text-stone-400 text-xs">별도</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          {venue.rating}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-rose-600 bg-rose-50/30 group-hover:bg-rose-50/50">
                        {formatMoney(venue.totalEstimate)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(venue); }} className="text-stone-400 hover:text-stone-700 p-1">수정</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(venue.id); }} className="text-red-300 hover:text-red-500 p-1">삭제</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Action Bar for Comparison (Desktop Only) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in hidden md:block">
          <div className="bg-stone-800 text-white rounded-full shadow-xl px-6 py-3 flex items-center gap-4 pr-2">
            <span className="font-bold text-sm pl-2">{selectedIds.size}개 선택됨</span>
            <div className="h-4 w-px bg-stone-600"></div>
            <button 
               onClick={() => setIsCompareOpen(true)}
               className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2 rounded-full transition-colors flex items-center gap-2"
            >
               비교하기 <LayoutGrid size={16}/>
            </button>
            <button 
              onClick={() => setSelectedIds(new Set())}
              className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isCompareOpen && (
        <VenueCompare 
          venues={venues.filter(v => selectedIds.has(v.id))} 
          onClose={() => setIsCompareOpen(false)} 
        />
      )}

      {/* Gallery Viewer */}
      {selectedVenueForGallery && (
        <GalleryViewer
           isOpen={galleryOpen}
           onClose={() => { setGalleryOpen(false); setSelectedVenueForGallery(null); }}
           images={selectedVenueForGallery.images}
           initialIndex={selectedVenueForGallery.thumbnailImage 
              ? selectedVenueForGallery.images.findIndex(img => img.id === selectedVenueForGallery.thumbnailImage)
              : 0
           }
        />
      )}

      {/* Mobile Filters Bottom Sheet */}
      <BottomSheet 
        isOpen={isFilterSheetOpen} 
        onClose={() => setIsFilterSheetOpen(false)} 
        title="필터 및 정렬"
        action={
          <div className="flex gap-3">
             <Button variant="secondary" className="flex-1" onClick={() => { 
                setSortBy('createdAt'); 
                setStatusFilter('all'); 
                setSdmFilter('all'); 
                setLocationFilter(''); 
                setIsFilterSheetOpen(false); 
             }}>초기화</Button>
             <Button className="flex-[2]" onClick={() => setIsFilterSheetOpen(false)}>결과 보기</Button>
          </div>
        }
      >
        <div className="space-y-6 pb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-stone-800">정렬 기준</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setSortBy('price')} className={`p-3 rounded-xl border text-sm font-medium transition-colors ${sortBy === 'price' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}>예상 견적순</button>
              <button onClick={() => setSortBy('rating')} className={`p-3 rounded-xl border text-sm font-medium transition-colors ${sortBy === 'rating' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}>별점순</button>
              <button onClick={() => setSortBy('minGuests')} className={`p-3 rounded-xl border text-sm font-medium transition-colors ${sortBy === 'minGuests' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}>보증인원순</button>
              <button onClick={() => setSortBy('createdAt')} className={`p-3 rounded-xl border text-sm font-medium transition-colors ${sortBy === 'createdAt' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}>최근 등록순</button>
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-stone-800">지역</label>
             <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="w-full p-3 rounded-xl border border-stone-200 bg-white text-stone-600 outline-none">
                <option value="">모든 지역</option>
                {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
             </select>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-stone-800">스드메 포함 여부</label>
             <div className="flex gap-2">
                {['all', 'included', 'excluded'].map(opt => (
                  <button key={opt} onClick={() => setSdmFilter(opt as SdmFilter)} className={`flex-1 p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${sdmFilter === opt ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}>
                    {opt === 'all' ? '전체' : opt === 'included' ? '포함' : '별도'}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-stone-800">진행 상태</label>
             <div className="grid grid-cols-2 gap-2">
                {['all', 'pending', 'visited', 'contracted'].map(status => (
                  <button key={status} onClick={() => setStatusFilter(status as FilterStatus)} className={`p-3 rounded-xl border text-sm font-medium capitalize transition-colors ${statusFilter === status ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-stone-200 text-stone-600'}`}>
                    {status === 'all' ? '전체' : status === 'pending' ? '방문 예정' : status === 'visited' ? '방문 완료' : '계약 완료'}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </BottomSheet>

      {isFormOpen && (
        <VenueForm 
          initialData={editingVenue} 
          onSubmit={handleSaveVenue} 
          onCancel={() => { setIsFormOpen(false); setEditingVenue(null); }} 
        />
      )}
    </div>
  );
};