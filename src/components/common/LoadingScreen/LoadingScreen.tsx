export const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
      <div className="text-center">
        {/* 로고 또는 아이콘 */}
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 bg-rose-200 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-rose-400 to-rose-500 rounded-full flex items-center justify-center">
            <span className="text-2xl">💒</span>
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <p className="text-stone-500 text-sm animate-pulse">로딩 중...</p>
      </div>
    </div>
  );
};

// 페이지 내부 로딩용 (더 작은 버전)
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin`}
      />
    </div>
  );
};

// 페이지 컨텐츠 로딩용
export const PageLoader = () => {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
};
