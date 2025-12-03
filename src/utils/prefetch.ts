/**
 * 컴포넌트 프리페치
 * 마우스 호버 시 미리 로드
 */
export const prefetchComponent = (importFn: () => Promise<any>) => {
  // 브라우저가 유휴 상태일 때 프리페치
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => importFn());
  } else {
    setTimeout(() => importFn(), 200);
  }
};

// 페이지 프리페치 함수들
export const prefetchPages = {
  dashboard: () => import('../pages/Dashboard'),
  budget: () => import('../pages/Budget'),
  venues: () => import('../pages/Venues'),
  checklist: () => import('../pages/Checklist'),
  schedule: () => import('../pages/Schedule'),
  settings: () => import('../pages/Settings'),
  login: () => import('../src/pages/Login'),
  register: () => import('../src/pages/Register'),
};
