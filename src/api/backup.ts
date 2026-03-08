import apiClient from './client';

export const backupAPI = {
  // 전체 데이터 JSON 내보내기
  exportData: (): Promise<any> =>
    apiClient.get('/backup/export').then((res) => res.data),

  // JSON 데이터 가져오기
  importData: (data: any): Promise<void> =>
    apiClient.post('/backup/import', data).then(() => undefined),
};
