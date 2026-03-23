import apiClient from '@/lib/api';
import { User } from './types';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: Partial<User>) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}/profile`, userData);
    return response.data;
  },

  deleteAccount: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};