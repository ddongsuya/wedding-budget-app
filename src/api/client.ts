import axios, { AxiosError } from 'axios';
import { captureError } from '../lib/sentry';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// 사용자 친화적 에러 메시지 매핑
const getErrorMessage = (error: AxiosError<any>): string => {
  // 네트워크 에러
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    return '네트워크 연결을 확인해주세요.';
  }

  const status = error.response.status;
  const serverMessage = error.response.data?.message || error.response.data?.error;

  // 서버에서 제공한 메시지가 있으면 사용
  if (serverMessage && typeof serverMessage === 'string') {
    return serverMessage;
  }

  // HTTP 상태 코드별 기본 메시지
  switch (status) {
    case 400:
      return '입력 정보를 확인해주세요.';
    case 401:
      return '로그인이 필요합니다.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 정보를 찾을 수 없습니다.';
    case 409:
      return '이미 존재하는 데이터입니다.';
    case 422:
      return '입력 형식이 올바르지 않습니다.';
    case 429:
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    case 502:
    case 503:
    case 504:
      return '서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해주세요.';
    default:
      return '오류가 발생했습니다. 다시 시도해주세요.';
  }
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable sending cookies with requests (Requirements 7.1)
  withCredentials: true,
  timeout: 30000, // 30초 타임아웃
});

// 요청 인터셉터: 토큰 자동 첨부 (backward compatibility with localStorage)
apiClient.interceptors.request.use(
  (config) => {
    // Only add Authorization header if token exists in localStorage (fallback)
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    // 401 제외하고 Sentry에 에러 캡처
    if (error.response?.status !== 401) {
      captureError(error, {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }

    // 401 에러 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh using cookie (server will read from cookie)
        // Also send refreshToken from localStorage for backward compatibility
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`, 
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Store in localStorage for backward compatibility
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 사용자 친화적 에러 메시지 추가
    const userFriendlyMessage = getErrorMessage(error);
    const enhancedError = error as any;
    enhancedError.userMessage = userFriendlyMessage;

    return Promise.reject(enhancedError);
  }
);

export default apiClient;
export { getErrorMessage };
