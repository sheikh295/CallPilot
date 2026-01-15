import { apiClient } from '../lib/api-client';
import {
  Call,
  CallsListResponse,
  CreateCallDto,
  LaunchCallDto,
} from '../types';

export const callsApi = {
  getAll: async (page: number = 1, limit: number = 10, search?: string): Promise<CallsListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) {
      params.append('search', search);
    }
    const response = await apiClient.get<CallsListResponse>(`/v1/calls?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Call> => {
    const response = await apiClient.get<Call>(`/v1/calls/${id}`);
    return response.data;
  },

  create: async (data: CreateCallDto): Promise<Call> => {
    const response = await apiClient.post<Call>('/v1/calls', data);
    return response.data;
  },

  launch: async (id: string, data?: LaunchCallDto): Promise<Call> => {
    const response = await apiClient.post<Call>(`/v1/calls/${id}/launch`, data || {});
    return response.data;
  },
};
