/**
 * 이미지 최적화 유틸리티
 * 로컬 업로드 이미지를 위한 최적화 함수
 */

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  blur?: number;
  placeholder?: boolean;
}

/**
 * 이미지 URL에 쿼리 파라미터를 추가하여 최적화 요청
 * (백엔드에서 sharp로 처리하도록 유도)
 */
export const optimizeImage = (
  url: string | null | undefined,
  options: ImageOptions = {}
): string => {
  if (!url) return '';

  // 외부 URL이면 그대로 반환
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    return url;
  }

  const {
    width,
    height,
    quality = 80,
    format = 'auto',
    crop = 'fill',
    blur,
    placeholder = false,
  } = options;

  // 플레이스홀더용 (매우 작고 흐린 이미지)
  if (placeholder) {
    const params = new URLSearchParams({
      w: '50',
      q: '30',
      blur: '20',
    });
    return `${url}?${params.toString()}`;
  }

  // 일반 최적화
  const params = new URLSearchParams();
  if (width) params.append('w', width.toString());
  if (height) params.append('h', height.toString());
  if (quality) params.append('q', quality.toString());
  if (format && format !== 'auto') params.append('f', format);
  if (crop) params.append('c', crop);
  if (blur) params.append('blur', blur.toString());

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * 프리셋 이미지 사이즈
 */
export const imagePresets = {
  // 썸네일 (목록용)
  thumbnail: { width: 200, height: 200, crop: 'fill' as const },

  // 카드 이미지
  card: { width: 400, height: 300, crop: 'fill' as const },

  // 상세 이미지
  detail: { width: 800, height: 600, crop: 'fit' as const },

  // 전체 화면
  fullscreen: { width: 1200, crop: 'fit' as const },

  // 프로필 이미지
  avatar: { width: 150, height: 150, crop: 'fill' as const },

  // 식장 갤러리
  venueGallery: { width: 600, height: 400, crop: 'fill' as const },

  // 영수증
  receipt: { width: 500, crop: 'fit' as const },

  // 플레이스홀더 (블러 로딩용)
  placeholder: { placeholder: true },
};

/**
 * 반응형 이미지 srcSet 생성
 */
export const generateSrcSet = (
  url: string,
  sizes: number[] = [320, 640, 960, 1280]
): string => {
  if (!url) return '';

  return sizes
    .map((size) => {
      const optimizedUrl = optimizeImage(url, { width: size, quality: 80 });
      return `${optimizedUrl} ${size}w`;
    })
    .join(', ');
};

/**
 * 이미지 프리로드
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * 여러 이미지 프리로드
 */
export const preloadImages = async (sources: string[]): Promise<void> => {
  await Promise.all(sources.map(preloadImage));
};
