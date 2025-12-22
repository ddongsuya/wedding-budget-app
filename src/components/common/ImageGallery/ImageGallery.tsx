import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage/OptimizedImage';
import { optimizeImage, imagePresets } from '../../../utils/imageOptimizer';

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export const ImageGallery = ({ images, className = '' }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goToPrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  };

  const goToNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
  };

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
  };

  if (images.length === 0) return null;

  return (
    <div className={className} role="region" aria-label="이미지 갤러리">
      {/* 썸네일 그리드 */}
      <div className="grid grid-cols-3 gap-1" role="list" aria-label="이미지 목록">
        {images.slice(0, 6).map((src, index) => (
          <button
            key={index}
            onClick={() => openLightbox(index)}
            className="aspect-square relative overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
            aria-label={`이미지 ${index + 1}${index === 5 && images.length > 6 ? `, 외 ${images.length - 6}개 더보기` : ''}`}
            role="listitem"
          >
            <OptimizedImage
              src={src}
              alt={`이미지 ${index + 1}`}
              preset="thumbnail"
              className="w-full h-full"
            />
            {/* 더보기 오버레이 */}
            {index === 5 && images.length > 6 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-semibold">+{images.length - 6}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox 모달 */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-modal="true"
          aria-label={`이미지 뷰어: ${selectedIndex + 1}/${images.length}`}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full z-10"
            aria-label="닫기"
          >
            <X size={24} aria-hidden="true" />
          </button>

          {/* 이전 버튼 */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full z-10"
              aria-label="이전 이미지"
            >
              <ChevronLeft size={32} aria-hidden="true" />
            </button>
          )}

          {/* 메인 이미지 */}
          <div className="max-w-full max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={optimizeImage(images[selectedIndex], imagePresets.fullscreen)}
              alt={`이미지 ${selectedIndex + 1}/${images.length}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {/* 다음 버튼 */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full z-10"
              aria-label="다음 이미지"
            >
              <ChevronRight size={32} aria-hidden="true" />
            </button>
          )}

          {/* 인디케이터 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="이미지 인디케이터">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedIndex ? 'bg-white' : 'bg-white/40'
                }`}
                role="tab"
                aria-selected={index === selectedIndex}
                aria-label={`이미지 ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
