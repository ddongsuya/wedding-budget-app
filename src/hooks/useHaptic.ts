/**
 * 햅틱 피드백 훅
 * 모바일에서 버튼 클릭, 스와이프 등에 진동 피드백 제공
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHaptic = () => {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const haptic = (type: HapticType = 'light') => {
    switch (type) {
      case 'light':
        vibrate(10);
        break;
      case 'medium':
        vibrate(20);
        break;
      case 'heavy':
        vibrate(30);
        break;
      case 'success':
        vibrate([10, 50, 10]);
        break;
      case 'warning':
        vibrate([20, 30, 20]);
        break;
      case 'error':
        vibrate([30, 50, 30, 50, 30]);
        break;
    }
  };

  return { haptic, vibrate };
};

export default useHaptic;
