import { apiClient } from '../lib/api-client';
import {
  SignInDto,
  SignInResponse,
} from '../types';

export const authApi = {
  signIn: async (data: SignInDto): Promise<SignInResponse> => {
    const response = await apiClient.post<SignInResponse>('/v1/auth/signin', data);
    return response.data;
  },
};
