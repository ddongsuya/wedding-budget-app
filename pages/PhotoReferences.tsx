import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Heart, Trash2, X, Filter, Grid, List, Tag, ExternalLink, Edit2 } from 'lucide-react';
import { photoReferenceAPI, PhotoReference, PhotoCategory } from '../src/api/photoReferences';
import { compressImage } from '../src/utils/imageCompression';
import { useToast } from '../src/hooks/useToast';
import { EmptyState } from '../src/components/common/EmptyState/EmptyState';
import { Skeleton } from '../src/components/common/Skeleton/Skeleton';

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
      
      // 이미지 압축
      const compressed = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxSizeMB: 0.8,
      });

      // Base64로 변환
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadData(prev => ({ ...prev, image_url: reader.result as string }));
        setShowUploadModal(true);
        setUploading(false);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      toast.error('이미지 처리에 실패했습니다');
      setUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.image_url) {
      toast.error('이미지를 선택해주세요');
      return;
    }

    try {
      setUploading(true);
      await photoReferenceAPI.create(uploadData);
      toast.success('사진이 추가되었습니다');
      setShowUploadModal(false);
      setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
      loadPhotos();
    } catch (error) {
      toast.error('업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
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
    if (!confirm('이 사진을 삭제하시겠습니까?')) return;
    
    try {
      await photoReferenceAPI.delete(photo.id);
      toast.success('사진이 삭제되었습니다');
      setSelectedPhoto(null);
      loadPhotos();
    } catch (error) {
      toast.error('삭제에 실패했습니다');
    }
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

  // 필터링된 사진
  const filteredPhotos = photos.filter(photo => {
    if (selectedCategory !== 'all' && photo.category !== selectedCategory) return false;
    if (showFavoritesOnly && !photo.is_favorite) return false;
    return true;
  });

  const getCategoryInfo = (categoryId: string) => 
    CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="min-h-screen bg-stone-50 pb-24 md:pb-0">
      {/* 헤더 */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-[60px] md:top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-stone-800">📸 포토 레퍼런스</h1>
            <p className="text-sm text-stone-500">스냅 촬영 참고 사진을 모아보세요</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Plus size={18} />
            )}
            사진 추가
          </button>
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
            className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-rose-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            전체
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 flex-shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
            </button>
          ))}
        </div>

        {/* 필터 옵션 */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
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
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 gap-3' : 'space-y-3'}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} variant="rounded" width="100%" height={viewMode === 'grid' ? 200 : 80} />
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <EmptyState
            illustration="photo"
            title={selectedCategory !== 'all' ? '이 카테고리에 사진이 없어요' : '아직 레퍼런스 사진이 없어요'}
            description="마음에 드는 스냅 사진을 추가해보세요"
            actionLabel="사진 추가하기"
            onAction={() => fileInputRef.current?.click()}
          />
        ) : viewMode === 'grid' ? (
          /* 그리드 뷰 */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredPhotos.map(photo => {
              const category = getCategoryInfo(photo.category);
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="relative group cursor-pointer rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square">
                    <img
                      src={photo.image_url}
                      alt={photo.title || '레퍼런스 사진'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 오버레이 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* 즐겨찾기 버튼 */}
                  <button
                    onClick={(e) => handleToggleFavorite(photo, e)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <Heart
                      size={16}
                      className={photo.is_favorite ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}
                    />
                  </button>
                  
                  {/* 카테고리 뱃지 */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-white/80 rounded-full text-xs font-medium">
                    {category.icon} {category.name}
                  </span>
                  
                  {/* 제목 */}
                  {photo.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium truncate">{photo.title}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* 리스트 뷰 */
          <div className="space-y-3">
            {filteredPhotos.map(photo => {
              const category = getCategoryInfo(photo.category);
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="bg-white rounded-xl p-3 shadow-sm flex gap-3 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={photo.image_url}
                      alt={photo.title || '레퍼런스 사진'}
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

          {/* 이미지 */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <img
              src={selectedPhoto.image_url}
              alt={selectedPhoto.title || '레퍼런스 사진'}
              className="max-w-full max-h-full object-contain"
            />
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-lg max-h-[85vh] md:max-h-[90vh] md:mx-4 flex flex-col">
            <div className="flex-shrink-0 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl">
              <h2 className="text-xl font-bold text-stone-800">사진 추가</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
                }}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={24} className="text-stone-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 미리보기 */}
              {uploadData.image_url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-stone-100">
                  <img
                    src={uploadData.image_url}
                    alt="미리보기"
                    className="w-full h-full object-contain"
                  />
                </div>
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
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
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
            <div 
              className="flex-shrink-0 flex gap-3 p-4 border-t border-stone-200 bg-white"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ image_url: '', category: 'etc', title: '', memo: '', tags: [] });
                }}
                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-xl font-medium hover:bg-stone-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {uploading ? '업로드 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoReferences;
