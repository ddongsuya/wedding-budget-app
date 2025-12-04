import apiClient from './client';

export interface PhotoReference {
  id: number;
  couple_id: number;
  image_url: string;
  category: string;
  title: string;
  memo: string;
  tags: string[];
  source_url: string | null;
  is_favorite: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface PhotoCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CreatePhotoInput {
  image_url: string;
  category?: string;
  title?: string;
  memo?: string;
  tags?: string[];
  source_url?: string;
}

export interface UpdatePhotoInput {
  category?: string;
  title?: string;
  memo?: string;
  tags?: string[];
  is_favorite?: boolean;
}

export const photoReferenceAPI = {
  getAll: (category?: string) => 
    apiClient.get('/photo-references', { params: category ? { category } : {} }),
  
  create: (data: CreatePhotoInput) => 
    apiClient.post('/photo-references', data),
  
  update: (id: number, data: UpdatePhotoInput) => 
    apiClient.put(`/photo-references/${id}`, data),
  
  delete: (id: number) => 
    apiClient.delete(`/photo-references/${id}`),
  
  toggleFavorite: (id: number) => 
    apiClient.patch(`/photo-references/${id}/favorite`),
};
