import apiClient from './client';
import { Venue } from '../types';

export interface VenueListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface VenueCreateInput {
  name: string;
  type?: string;
  location?: string;
  contact?: string;
  price?: number;
  capacity?: number;
  visit_date?: string;
  rating?: number;
  pros?: string;
  cons?: string;
  notes?: string;
  images?: string[];
  status?: string;
}

export type VenueUpdateInput = Partial<VenueCreateInput>;

export const venueAPI = {
  getList: (params?: VenueListParams) => apiClient.get('/venues', { params }),
  getById: (id: string) => apiClient.get(`/venues/${id}`),
  create: (data: VenueCreateInput) => apiClient.post('/venues', data),
  update: (id: string, data: VenueUpdateInput) => apiClient.put(`/venues/${id}`, data),
  delete: (id: string) => apiClient.delete(`/venues/${id}`),
};
