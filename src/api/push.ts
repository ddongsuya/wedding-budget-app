import apiClient from './client';

export const pushAPI = {
  // VAPID 공개 키 가져오기
  getVapidPublicKey: () =>
    apiClient.get<{
      success: boolean;
      data: { publicKey: string };
    }>('/push/vapid-public-key'),

  // 푸시 구독 등록
  subscribe: (subscription: PushSubscriptionJSON) =>
    apiClient.post<{
      success: boolean;
      message: string;
    }>('/push/subscribe', { subscription }),

  // 푸시 구독 해제
  unsubscribe: (endpoint: string) =>
    apiClient.delete<{
      success: boolean;
      message: string;
    }>('/push/unsubscribe', { data: { endpoint } }),
};

// 푸시 알림 권한 요청 및 구독
export const subscribeToPush = async (): Promise<boolean> => {
  try {
    // 브라우저 지원 확인
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    // VAPID 공개 키 가져오기
    const response = await pushAPI.getVapidPublicKey();
    const vapidPublicKey = response.data.data.publicKey;
    
    if (!vapidPublicKey) {
      console.log('VAPID public key not available');
      return false;
    }

    // Service Worker 등록 확인
    const registration = await navigator.serviceWorker.ready;

    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    // 구독이 없으면 새로 생성
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // 서버에 구독 정보 전송
    await pushAPI.subscribe(subscription.toJSON());
    
    return true;
  } catch (error) {
    console.error('Push subscription error:', error);
    return false;
  }
};

// 푸시 구독 해제
export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await pushAPI.unsubscribe(subscription.endpoint);
      await subscription.unsubscribe();
    }

    return true;
  } catch (error) {
    console.error('Push unsubscription error:', error);
    return false;
  }
};

// Base64 URL을 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
