/**
 * 이미지 압축 유틸리티
 * 업로드 전에 이미지를 자동으로 압축하여 용량을 줄입니다.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

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
  } = options;

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
            console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)}MB → Compressed: ${sizeMB.toFixed(2)}MB`);

            // 압축된 파일이 여전히 크면 품질을 더 낮춤
            if (sizeMB > maxSizeMB && quality > 0.5) {
              compressImage(file, { ...options, quality: quality - 0.1 })
                .then(resolve)
                .catch(reject);
              return;
            }

            // File 객체 생성
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
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
