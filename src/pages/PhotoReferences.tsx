import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Heart, Trash2, X, Grid, List, ExternalLink, Edit3, Link, Upload, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { photoReferenceAPI, PhotoReference, PhotoCategory } from '@/api/photoReferences';
import { compressImage } from '@/utils/imageCompression';
import { useToast } from '@/hooks/useToast';
import { EmptyState } from '@/components/common/EmptyState/EmptyState';
import { PhotoReferencesGridSkeleton } from '@/components/skeleton/PhotoReferencesSkeleton';
import { Skeleton } from '@/components/common/Skeleton/Skeleton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog/ConfirmDialog';
import PhotoEditModal from '@/components/photo/PhotoEditModal';
import { PageTip } from '@/components/common/PageTip/PageTip';

const CATEGORIES: PhotoCategory[] = [
  { id: 'outdoor', name: '야외', icon: '🌳' },
  { id: 'indoor', name: '실내', icon: '🏠' },
  { id: 'pose', name: '포즈', icon: '💃' },
  { id: 'props', name: '소품', icon: '🎀' },
  { id: 'dress', name: '드레스', icon: '👗' },
  { id: 'suit', name: '수트', icon: '🤵' },
  { id: 'makeup', name: '메이크업', icon: '💄' },
  { id: 'etc', name: '기타', icon: '📷' },
];

// Sortable photo card for drag-and-drop
interface SortablePhotoCardProps {
  photo: PhotoReference;
  index: number;
  getCategoryInfo: (id: string) => PhotoCategory;
  onSelect: (photo: PhotoReference) => void;
  onToggleFavorite: (photo: PhotoReference, e: React.MouseEvent) => void;
}

const SortablePhotoCard: React.FC<SortablePhotoCardProps> = ({ photo, index, getCategoryInfo, onSelect, onToggleFavorite }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const category = getCategoryInfo(photo.category);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    animationDelay: `${index * 30}ms`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all stagger-item touch-feedback active:scale-[0.98]"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 bg-white/80 rounded-full hover:bg-white transition-colors cursor-grab active:cursor-grabbing"
        onClick={e => e.stopPropagation()}
      >
        <GripVertical size={14} className="text-stone-400" />
      </button>

      <div className="aspect-square" onClick={() => onSelect(photo)}>
        <img
          src={photo.image_url}
          alt={photo.title || '레퍼런스 사진'}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <button
        onClick={(e) => onToggleFavorite(photo, e)}
        className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors z-10"
      >
        <Heart
          size={16}
          className={photo.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}
        />
      </button>
      
      <span className="absolute top-10 left-2 px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium">
        {category.icon} {category.name}
      </span>
      
      {photo.title && (
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-white text-sm font-medium truncate">{photo.title}</p>
        </div>
      )}
    </div>
  );
};

const PhotoReferences: React.FC = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photos, setPhotos] = useState<PhotoReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 모달 상태
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoReference | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    image_url: '',
    category: 'etc',
    title: '',
    memo: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [deletingPhoto, setDeletingPhoto] = useState<PhotoReference | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<PhotoReference | null>(null);
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlPreviewError, setUrlPreviewError] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await photoReferenceAPI.getAll();
      setPhotos(response.data.data || []);
    } catch (error) {
      toast.error('사진을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };


  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // 이미지 압축 (WebP 포맷 자동 변환) - 더 강한 압축 적용
      const compressed = await compressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.7,
        maxSizeMB: 0.5,
        format: 'auto', // WebP 지원 시 자동 변환
      });

      // Base64로 변환
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Base64 크기 체크 (약 7MB 제한 - 서버 10MB 제한의 안전 마진)
        if (base64.length > 7000000) {
          toast.error('이미지가 너무 큽니다. 더 작은 이미지를 선택해주세요.');
          setUploading(false);
          return;
        }
        setUploadData(prev => ({ ...prev, image_url: base64 }));
        setShowUploadModal(true);
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('이미지 읽기에 실패했습니다');
        setUploading(false);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      console.error('Image compression error:', error);
      toast.error('이미지 처리에 실패했습니다');
      setUploading(false);
    }
    
    // input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!uploadData.image_url) {
      toast.error('이미지를 선택해주세요');
      return;
    }

    try {
      setUploading(true);
      
      // 빈 값 정리
      const cleanData = {
        image_url: uploadData.image_url,
        category: uploadData.category || 'etc',
        title: uploadData.title?.trim() || undefined,
        memo: uploadData.memo?.trim() || undefined,
        tags: uploadData.tags && uploadData.tags.length > 0 ? uploadData.tags : undefined,
        source_url: uploadTab === 'url' ? urlInput.trim() || undefined : undefined,
      };
      
      await photoReferenceAPI.create(cleanData);
      toast.success('사진이 추가되었습니다');
      setShowUploadModal(false);
      setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
      setUrlInput('');
      setUrlPreviewError(false);
      setUploadTab('file');
      loadPhotos();
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || '업로드에 실패했습니다';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlPreview = () => {
    const url = urlInput.trim();
    if (!url) {
      toast.error('URL을 입력해주세요');
      return;
    }
    try {
      new URL(url);
    } catch {
      toast.error('올바른 URL을 입력해주세요');
      return;
    }
    setUrlPreviewError(false);
    setUploadData(prev => ({ ...prev, image_url: url }));
    setShowUploadModal(true);
  };

  const openUploadModalForUrl = () => {
    setUploadTab('url');
    setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
    setUrlInput('');
    setUrlPreviewError(false);
    setShowUploadModal(true);
  };

  const handleToggleFavorite = async (photo: PhotoReference, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await photoReferenceAPI.toggleFavorite(photo.id);
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, is_favorite: !p.is_favorite } : p
      ));
    } catch (error) {
      toast.error('즐겨찾기 변경에 실패했습니다');
    }
  };

  const handleDelete = async (photo: PhotoReference) => {
    setDeletingPhoto(photo);
  };

  const confirmDelete = async () => {
    if (!deletingPhoto) return;
    try {
      await photoReferenceAPI.delete(deletingPhoto.id);
      toast.success('사진이 삭제되었습니다');
      setSelectedPhoto(null);
      loadPhotos();
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
    setDeletingPhoto(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !uploadData.tags.includes(tagInput.trim())) {
      setUploadData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setUploadData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handlePhotoUpdated = (updated: PhotoReference) => {
    setPhotos(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selectedPhoto?.id === updated.id) {
      setSelectedPhoto(updated);
    }
    toast.success('사진이 수정되었습니다');
  };

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = filteredPhotos.findIndex(p => p.id === active.id);
    const newIndex = filteredPhotos.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredPhotos, oldIndex, newIndex);
    
    // Optimistic update
    const reorderedIds = new Set(reordered.map(p => p.id));
    const otherPhotos = photos.filter(p => !reorderedIds.has(p.id));
    setPhotos([...reordered, ...otherPhotos]);

    // Send reorder to backend
    const orders = reordered.map((p, i) => ({ id: p.id, sort_order: i }));
    try {
      await photoReferenceAPI.reorder(orders);
    } catch {
      toast.error('순서 변경에 실패했습니다');
      loadPhotos();
    }
  };

  // 필터링된 사진
  const filteredPhotos = photos.filter(photo => {
    if (selectedCategory !== 'all' && photo.category !== selectedCategory) return false;
    if (showFavoritesOnly && !photo.is_favorite) return false;
    return true;
  });

  // 카테고리별 사진 개수
  const categoryCounts = photos.reduce<Record<string, number>>((acc, photo) => {
    acc[photo.category] = (acc[photo.category] || 0) + 1;
    return acc;
  }, {});

  const getCategoryInfo = (categoryId: string) => 
    CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];

  // 사진 갤러리 네비게이션
  const currentPhotoIndex = selectedPhoto ? filteredPhotos.findIndex(p => p.id === selectedPhoto.id) : -1;
  const canGoPrev = currentPhotoIndex > 0;
  const canGoNext = currentPhotoIndex >= 0 && currentPhotoIndex < filteredPhotos.length - 1;

  const goToPrevPhoto = useCallback(() => {
    if (canGoPrev) {
      setSelectedPhoto(filteredPhotos[currentPhotoIndex - 1]);
    }
  }, [canGoPrev, currentPhotoIndex, filteredPhotos]);

  const goToNextPhoto = useCallback(() => {
    if (canGoNext) {
      setSelectedPhoto(filteredPhotos[currentPhotoIndex + 1]);
    }
  }, [canGoNext, currentPhotoIndex, filteredPhotos]);

  // 키보드 좌우 화살표 네비게이션
  useEffect(() => {
    if (!selectedPhoto) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevPhoto();
      if (e.key === 'ArrowRight') goToNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, goToPrevPhoto, goToNextPhoto]);

  // 터치 스와이프 핸들러
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (diff > threshold) goToNextPhoto();
    else if (diff < -threshold) goToPrevPhoto();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      <PageTip pageKey="photos" />
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-lg px-4 py-4 shadow-soft sticky top-[60px] md:top-0 z-10 border-b border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-stone-800">📸 포토 레퍼런스</h1>
            <p className="text-sm text-stone-500">스냅 촬영 참고 사진을 모아보세요</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openUploadModalForUrl}
              className="bg-stone-100 text-stone-700 px-3 py-2.5 rounded-xl font-semibold hover:bg-stone-200 transition-all flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Link size={16} />
              <span className="hidden sm:inline">URL</span>
            </button>
            <button
              onClick={() => { setUploadTab('file'); fileInputRef.current?.click(); }}
              disabled={uploading}
              className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-4 py-2.5 rounded-xl font-semibold shadow-button hover:shadow-button-hover hover:from-rose-600 hover:to-rose-700 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {uploading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Plus size={18} />
              )}
              사진 추가
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-button'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              selectedCategory === 'all' ? 'bg-white/20' : 'bg-stone-200'
            }`}>
              {photos.length}
            </span>
          </button>
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-button'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.name}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat.id ? 'bg-white/20' : 'bg-stone-200'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 필터 옵션 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-all ${
              showFavoritesOnly
                ? 'bg-rose-100 text-rose-600'
                : 'text-stone-500 hover:bg-stone-100'
            }`}
          >
            <Heart size={14} className={showFavoritesOnly ? 'fill-rose-500' : ''} />
            즐겨찾기만
          </button>

          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <Grid size={16} className={viewMode === 'grid' ? 'text-rose-500' : 'text-stone-500'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List size={16} className={viewMode === 'list' ? 'text-rose-500' : 'text-stone-500'} />
            </button>
          </div>
        </div>
      </div>


      {/* 콘텐츠 */}
      <div className="p-4">
        {loading ? (
          viewMode === 'grid' ? (
            <PhotoReferencesGridSkeleton />
          ) : (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl p-3 shadow-sm flex gap-3">
                  <Skeleton variant="rounded" width={80} height={80} />
                  <div className="flex-1">
                    <Skeleton variant="text" width={60} height={20} className="mb-2" />
                    <Skeleton variant="text" width="80%" height={18} className="mb-1" />
                    <Skeleton variant="text" width="60%" height={14} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            illustration="photo"
            title={selectedCategory !== 'all' ? '이 카테고리에 사진이 없어요' : '아직 레퍼런스 사진이 없어요'}
            description="마음에 드는 스냅 사진을 추가해보세요"
            actionLabel="사진 추가하기"
            onAction={() => fileInputRef.current?.click()}
          />
        ) : viewMode === 'grid' ? (
          /* 그리드 뷰 with drag-and-drop */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredPhotos.map(p => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredPhotos.map((photo, index) => (
                  <SortablePhotoCard
                    key={photo.id}
                    photo={photo}
                    index={index}
                    getCategoryInfo={getCategoryInfo}
                    onSelect={setSelectedPhoto}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          /* 리스트 뷰 */
          <div className="space-y-3">
            {filteredPhotos.map((photo, index) => {
              const category = getCategoryInfo(photo.category);
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="bg-white rounded-xl p-3 shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition-all stagger-item touch-feedback active:scale-[0.99]"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={photo.image_url}
                      alt={photo.title || '레퍼런스 사진'}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs bg-stone-100 px-2 py-0.5 rounded-full">
                          {category.icon} {category.name}
                        </span>
                        <h3 className="font-medium text-stone-800 mt-1 truncate">
                          {photo.title || '제목 없음'}
                        </h3>
                      </div>
                      <button
                        onClick={(e) => handleToggleFavorite(photo, e)}
                        className="p-1"
                      >
                        <Heart
                          size={18}
                          className={photo.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-stone-300'}
                        />
                      </button>
                    </div>
                    {photo.memo && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">{photo.memo}</p>
                    )}
                    {photo.tags && photo.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {photo.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* 사진 상세 모달 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 text-white">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingPhoto(selectedPhoto)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Edit3 size={24} />
              </button>
              <button
                onClick={(e) => handleToggleFavorite(selectedPhoto, e)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Heart
                  size={24}
                  className={selectedPhoto.is_favorite ? 'fill-rose-500 text-rose-500' : ''}
                />
              </button>
              <button
                onClick={() => handleDelete(selectedPhoto)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          {/* 이미지 with navigation */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-hidden relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* 이전 버튼 */}
            {canGoPrev && (
              <button
                onClick={goToPrevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
              >
                <ChevronLeft size={28} className="text-white" />
              </button>
            )}

            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.title || '레퍼런스 사진'}
              className="max-w-full max-h-full object-contain"
            />

            {/* 다음 버튼 */}
            {canGoNext && (
              <button
                onClick={goToNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors z-10"
              >
                <ChevronRight size={28} className="text-white" />
              </button>
            )}

            {/* 인디케이터 */}
            {filteredPhotos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                {currentPhotoIndex + 1} / {filteredPhotos.length}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="bg-white rounded-t-3xl p-6 max-h-[40vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-sm bg-stone-100 px-2 py-1 rounded-full">
                  {getCategoryInfo(selectedPhoto.category).icon} {getCategoryInfo(selectedPhoto.category).name}
                </span>
                <h2 className="text-xl font-bold text-stone-800 mt-2">
                  {selectedPhoto.title || '제목 없음'}
                </h2>
              </div>
            </div>

            {selectedPhoto.memo && (
              <p className="text-stone-600 mb-4">{selectedPhoto.memo}</p>
            )}

            {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {selectedPhoto.tags.map(tag => (
                  <span key={tag} className="text-sm text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {selectedPhoto.source_url && (
              <a
                href={selectedPhoto.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
              >
                <ExternalLink size={14} />
                출처 보기
              </a>
            )}
          </div>
        </div>
      )}

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-20 md:pb-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-full flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-stone-800">사진 추가</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
                  setUrlInput('');
                  setUrlPreviewError(false);
                }}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={24} className="text-stone-600" />
              </button>
            </div>

            {/* 탭 */}
            <div className="flex border-b border-stone-200">
              <button
                onClick={() => setUploadTab('file')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  uploadTab === 'file'
                    ? 'text-rose-600 border-b-2 border-rose-500'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Upload size={16} />
                파일 업로드
              </button>
              <button
                onClick={() => setUploadTab('url')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  uploadTab === 'url'
                    ? 'text-rose-600 border-b-2 border-rose-500'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <Link size={16} />
                URL로 추가
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* URL 입력 (URL 탭일 때) */}
              {uploadTab === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">이미지 URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={e => { setUrlInput(e.target.value); setUrlPreviewError(false); }}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleUrlPreview}
                      className="px-3 py-2.5 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors text-sm whitespace-nowrap"
                    >
                      미리보기
                    </button>
                  </div>
                </div>
              )}

              {/* 미리보기 */}
              {uploadData.image_url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={uploadData.image_url}
                    alt="미리보기"
                    className="w-full h-full object-contain"
                    onError={() => {
                      if (uploadTab === 'url') {
                        setUrlPreviewError(true);
                        toast.error('이미지를 불러올 수 없습니다. URL을 확인해주세요.');
                      }
                    }}
                  />
                </div>
              )}
              {uploadTab === 'url' && urlPreviewError && (
                <p className="text-sm text-red-500">이미지를 불러올 수 없습니다. URL을 확인해주세요.</p>
              )}

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">카테고리</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setUploadData(prev => ({ ...prev, category: cat.id }))}
                      className={`p-2 rounded-xl border-2 transition-all text-center ${
                        uploadData.category === cat.id
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <span className="text-lg md:text-xl">{cat.icon}</span>
                      <p className="text-xs mt-1">{cat.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">제목</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 해변 실루엣 샷"
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">메모</label>
                <textarea
                  value={uploadData.memo}
                  onChange={(e) => setUploadData(prev => ({ ...prev, memo: e.target.value }))}
                  placeholder="이 사진에 대한 메모를 남겨보세요"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">태그</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="태그 입력 후 Enter"
                    className="flex-1 px-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors text-sm"
                  >
                    추가
                  </button>
                </div>
                {uploadData.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {uploadData.tags.map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-sm text-rose-500 bg-rose-50 px-2 py-1 rounded-full"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-rose-700">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 - 하단 고정 */}
            <div className="flex-shrink-0 flex gap-3 p-4 border-t border-stone-200 bg-white rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
                  setUrlInput('');
                  setUrlPreviewError(false);
                }}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadData.image_url}
                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 사진 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={!!deletingPhoto}
        onClose={() => setDeletingPhoto(null)}
        onConfirm={confirmDelete}
        title="사진 삭제"
        message="이 사진을 삭제하시겠습니까?"
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />

      {/* 사진 수정 모달 */}
      {editingPhoto && (
        <PhotoEditModal
          photo={editingPhoto}
          isOpen={!!editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onUpdated={handlePhotoUpdated}
        />
      )}
    </div>
  );
};

export default PhotoReferences;
