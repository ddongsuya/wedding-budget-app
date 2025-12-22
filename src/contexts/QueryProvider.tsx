import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider
 * 
 * 앱 전체에서 React Query 캐싱을 사용할 수 있도록 설정
 * Requirements: 2.6 - API 데이터 캐싱으로 중복 네트워크 요청 감소
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
