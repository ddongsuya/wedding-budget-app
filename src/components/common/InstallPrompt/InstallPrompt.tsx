import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS 체크
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOSDevice && !isInStandaloneMode) {
      setIsIOS(true);
      // 이미 설치 안내를 본 적이 없으면 표시
      const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000); // 3초 후 표시
      }
    }

    // Android/Desktop 설치 프롬프트
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const hasSeenPrompt = localStorage.getItem('hasSeenInstallPrompt');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
        localStorage.setItem('hasSeenInstallPrompt', 'true');
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('hasSeenInstallPrompt', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💒</span>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            앱으로 설치하기
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            홈 화면에 추가하면 더 빠르게 접속할 수 있어요!
          </p>

          {isIOS ? (
            <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              <p className="flex items-center gap-2 mb-1">
                <span>1.</span>
                <span>하단의</span>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 rounded">
                  ⬆️
                </span>
                <span>공유 버튼 탭</span>
              </p>
              <p className="flex items-center gap-2">
                <span>2.</span>
                <span>"홈 화면에 추가" 선택</span>
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full py-2.5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-rose-500 hover:to-rose-600 transition-all"
            >
              <Download size={18} />
              설치하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
