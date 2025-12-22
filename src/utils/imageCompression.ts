/**
 * 이미지 압축 유틸리티
 * 업로드 전에 이미지를 자동으로 압축하여 용량을 줄입니다.
 * WebP 포맷 변환을 지원합니다.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
  format?: 'jpeg' | 'webp' | 'png' | 'auto';
}

/**
 * 브라우저가 WebP 포맷을 지원하는지 확인합니다
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const dataUrl = canvas.toDataURL('image/webp');
    resolve(dataUrl.startsWith('data:image/webp'));
  });
};

// WebP 지원 여부 캐시
let webpSupportCache: boolean | null = null;

/**
 * WebP 지원 여부를 캐시하여 반환합니다
 */
export const getWebPSupport = async (): Promise<boolean> => {
  if (webpSupportCache === null) {
    webpSupportCache = await supportsWebP();
  }
  return webpSupportCache;
};

/**
 * 최적의 이미지 포맷을 결정합니다
 */
const getOptimalFormat = async (requestedFormat: CompressOptions['format']): Promise<string> => {
  if (requestedFormat === 'auto') {
    const supportsWebp = await getWebPSupport();
    return supportsWebp ? 'image/webp' : 'image/jpeg';
  }
  return `image/${requestedFormat || 'jpeg'}`;
};

/**
 * 이미지 파일을 압축합니다
 * @param file 원본 이미지 파일
 * @param options 압축 옵션
 * @returns 압축된 이미지 파일
 */
export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    maxSizeMB = 2,
    format = 'auto',
  } = options;

  // 최적의 포맷 결정
  const mimeType = await getOptimalFormat(format);
  const extension = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/png' ? 'png' : 'jpg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 비율 유지하면서 크기 조정
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }

            // 파일 크기 확인
            const sizeMB = blob.size / 1024 / 1024;
            const formatName = mimeType === 'image/webp' ? 'WebP' : 'JPEG';
            console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Compressed (${formatName}): ${sizeMB.toFixed(2)}MB`);

            // 압축된 파일이 여전히 크면 품질을 더 낮추고 크기도 줄임
            if (sizeMB > maxSizeMB && quality > 0.3) {
              const newQuality = quality - 0.1;
              const newMaxWidth = Math.floor(maxWidth * 0.8);
              const newMaxHeight = Math.floor(maxHeight * 0.8);
              compressImage(file, { 
                ...options, 
                quality: newQuality,
                maxWidth: newMaxWidth,
                maxHeight: newMaxHeight
              })
                .then(resolve)
                .catch(reject);
              return;
            }

            // 파일 이름에서 확장자 변경
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const newFileName = `${baseName}.${extension}`;

            // File 객체 생성
            const compressedFile = new File([blob], newFileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Image load failed'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('File read failed'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * 여러 이미지를 한번에 압축합니다
 */
export const compressImages = async (
  files: File[],
  options?: CompressOptions
): Promise<File[]> => {
  return Promise.all(files.map(file => compressImage(file, options)));
};

/**
 * 이미지를 WebP 포맷으로 변환합니다
 * @param file 원본 이미지 파일
 * @param quality 품질 (0-1)
 * @returns WebP 포맷의 이미지 파일
 */
export const convertToWebP = async (
  file: File,
  quality: number = 0.85
): Promise<File> => {
  const supportsWebp = await getWebPSupport();
  
  if (!supportsWebp) {
    console.warn('WebP is not supported in this browser, returning original file');
    return file;
  }

  return compressImage(file, {
    quality,
    format: 'webp',
    maxWidth: 1920,
    maxHeight: 1920,
  });
};

/**
 * 파일이 이미지인지 확인합니다
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환합니다
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
