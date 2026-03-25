import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authService } from './authService';
import { authKeys } from './authKeys';
import { queryOptions } from '@/lib/queryClient';

export const useCurrentUser = () => {
  // Vérifier si un token est présent avant de faire l'appel
  const getToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  const hasToken = !!getToken();
  console.log('useCurrentUser - token exists:', hasToken, 'token:', getToken()?.substring(0, 20) + '...');

  return useQuery({
    queryKey: authKeys.me,
    queryFn: authService.getCurrentUser,
    enabled: hasToken, // N'exécuter la requête que si un token existe
    retry: (failureCount, error: any) => {
      // Ne pas réessayer si l'erreur est 401 (non autorisé) ou 500 (erreur serveur)
      if (error?.response?.status === 401 || error?.response?.status === 500) {
        return false;
      }
      // Limiter à 1 tentative seulement pour éviter les boucles
      return failureCount < 1;
    },
    retryDelay: 0, // Pas de délai pour les retry
    staleTime: 5 * 60 * 1000, // Considérer les données comme fraîches pendant 5 minutes
    refetchOnWindowFocus: false, // Ne pas re-fetch au focus de la fenêtre
    refetchOnReconnect: false, // Ne pas re-fetch à la reconnexion
    refetchOnMount: true, // Re-fetch au montage
    ...queryOptions.stable,
  });
};

// Hook sécurisé qui utilise les données localStorage au lieu d'appeler l'API
export const useCurrentUserSafe = () => {
  const getToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => {
      // Utiliser les données stockées dans localStorage au lieu d'appeler /api/auth/me
      const userData = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          // Validation basique des données utilisateur
          if (parsed && parsed.id && parsed.email && parsed.role) {
            return parsed;
          } else {
            console.warn('Données utilisateur invalides dans localStorage');
            return null;
          }
        } catch (error) {
          console.warn('Erreur lors de la lecture des données utilisateur:', error);
          return null;
        }
      }
      return null;
    },
    enabled: !!getToken(), // N'exécuter que si un token existe
    retry: false, // Pas de retry pour éviter les boucles
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false, // Ne pas re-fetch au focus (évite les redirections au rafraîchissement)
    refetchOnReconnect: false, // Ne pas re-fetch à la reconnexion
    ...queryOptions.stable,
  });
};

// Hook spécifique pour les pages de login - ne fait jamais d'appel API
export const useCurrentUserForLogin = () => {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => Promise.resolve(null), // Ne fait jamais d'appel API
    enabled: false, // Toujours désactivé
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions.stable,
  });
};