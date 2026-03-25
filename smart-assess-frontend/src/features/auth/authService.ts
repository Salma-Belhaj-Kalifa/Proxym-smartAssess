import apiClient, { removeAuthToken, removeAuthUserData } from '@/lib/api';
import API_ENDPOINTS from '@/config/apiEndpoints';
import { AuthResponse, User } from './types';

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  register: async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      removeAuthToken();
      removeAuthUserData();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
      console.log('API Response from /auth/me:', response.data);
      return response.data;
    } catch (error: any) {
      // En cas d'erreur 401 ou 500, nettoyer le token et retourner une valeur par défaut
      if (error.response?.status === 401 || error.response?.status === 500) {
        console.warn('Erreur d\'authentification, nettoyage du token:', error.response?.status);
        removeAuthToken();
        removeAuthUserData();
        // Retourner une valeur par défaut pour éviter les erreurs
        throw new Error('Session expirée ou invalide');
      }
      // Pour les autres erreurs, propager l'erreur
      throw error;
    }
  },
};