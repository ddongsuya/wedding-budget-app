import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflinePage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={40} className="text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          오프라인 상태예요
        </h1>
        
        <p className="text-gray-500 mb-6">
          인터넷 연결을 확인하고<br />
          다시 시도해주세요
        </p>
        
        <button
          onClick={handleRefresh}
          className="px-6 py-3 bg-rose-500 text-white rounded-xl font-medium flex items-center gap-2 mx-auto hover:bg-rose-600 transition-colors"
        >
          <RefreshCw size={18} />
          다시 시도
        </button>
      </div>
    </div>
  );
};
