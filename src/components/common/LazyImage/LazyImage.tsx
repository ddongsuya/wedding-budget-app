import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholderClassName?: string;
  threshold?: number;
  rootMargin?: string;
}

/**
 * 이미지 Lazy Loading 컴포넌트
 * Intersection Observer를 사용하여 뷰포트에 들어올 때만 이미지를 로드합니다.
 * native loading="lazy" 속성과 Intersection Observer를 함께 사용하여
 * 브라우저 지원 여부에 관계없이 최적의 성능을 제공합니다.
 */
export const LazyImage = ({
  src,
  alt,
  className = '',
  placeholderClassName = 'bg-stone-200 animate-pulse',
  threshold = 0.1,
  rootMargin = '100px',
  ...props
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer로 뷰포트 진입 감지
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // IntersectionObserver 지원 확인
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // 에러 발생 시 플레이스홀더 표시
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`flex items-center justify-center bg-stone-100 ${className}`}
        role="img"
        aria-label={alt || '이미지를 불러올 수 없습니다'}
        {...props}
      >
        <span className="text-stone-400 text-2xl" aria-hidden="true">📷</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative ${className}`} style={props.style}>
      {/* 플레이스홀더 (로딩 중) */}
      {!isLoaded && (
        <div className={`absolute inset-0 ${placeholderClassName}`} />
      )}
      
      {/* 실제 이미지 */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImage;
