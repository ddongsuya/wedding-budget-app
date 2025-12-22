import { useState, useEffect, useRef } from 'react';
import { optimizeImage, imagePresets, generateSrcSet } from '../../../utils/imageOptimizer';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  preset?: keyof typeof imagePresets;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  lazy?: boolean;
  placeholder?: 'blur' | 'skeleton' | 'none';
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage = ({
  src,
  alt,
  preset,
  width,
  height,
  className = '',
  objectFit = 'cover',
  lazy = true,
  placeholder = 'blur',
  onClick,
  onLoad,
  onError,
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // 이미지 옵션 설정
  const options = preset ? imagePresets[preset] : { width, height };
  const optimizedSrc = optimizeImage(src, options);
  const placeholderSrc =
    placeholder === 'blur' ? optimizeImage(src, imagePresets.placeholder) : '';
  const srcSet = src ? generateSrcSet(src) : '';

  // Intersection Observer로 lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // 이미지 없거나 에러 시
  if (!src || hasError) {
    return (
      <div
        className={`bg-stone-100 flex items-center justify-center ${className}`}
        style={{ width, height }}
        role="img"
        aria-label={alt || '이미지를 불러올 수 없습니다'}
      >
        <span className="text-stone-400 text-2xl" aria-hidden="true">📷</span>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
      onClick={onClick}
    >
      {/* 플레이스홀더 (블러 이미지) */}
      {placeholder === 'blur' && !isLoaded && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-${objectFit} scale-110 blur-lg`}
          aria-hidden="true"
        />
      )}

      {/* 스켈레톤 플레이스홀더 */}
      {placeholder === 'skeleton' && !isLoaded && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse" />
      )}

      {/* 실제 이미지 */}
      {isInView && (
        <img
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-${objectFit}
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}
    </div>
  );
};
