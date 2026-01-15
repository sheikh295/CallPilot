import { apiClient } from '../lib/api-client';
import {
  Contact,
  ContactsListResponse,
  CreateContactDto,
  UpdateContactDto,
} from '../types';

export const contactsApi = {
  getAll: async (page: number = 1, limit: number = 10, search?: string): Promise<ContactsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await apiClient.get<ContactsListResponse>(`/v1/contacts?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Contact> => {
    const response = await apiClient.get<Contact>(`/v1/contacts/${id}`);
    return response.data;
  },

  create: async (data: CreateContactDto): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/v1/contacts', data);
    return response.data;
  },

  update: async (id: string, data: UpdateContactDto): Promise<Contact> => {
    const response = await apiClient.patch<Contact>(`/v1/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/contacts/${id}`);
  },

  bulkUpload: async (file: File): Promise<{ inserted: number; failed: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/v1/contacts/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
