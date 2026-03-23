import axios from 'axios';
import { getCookie, deleteCookie, clearAuthCookies } from '@/utils/cookies';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Utiliser directement l'URL du backend
  timeout: 10000,
  withCredentials: true // Important pour envoyer les cookies
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
      
      if (!isAuthRequest) {
        const errorMessage = error.response?.data?.error || error.message || '';
        const isUserDeleted = errorMessage.includes('User not found') || 
                              errorMessage.includes('not found with email');
        
        console.warn('Erreur 401 détectée:', {
          url: error.config?.url,
          isAuthRequest,
          isUserDeleted,
          errorMessage
        });
        
        // Nettoyage complet des cookies
        clearAuthCookies();
        
        // Afficher un message à l'utilisateur
        const reason = isUserDeleted ? 'Compte utilisateur supprimé' : 'Session expirée';
        console.warn(`🔐 ${reason}, redirection vers la page de connexion`);
        
        // Tenter d'afficher un toast si disponible
        try {
          // Import dynamique pour éviter les erreurs d'import circulaire
          import('sonner').then(({ toast }) => {
            if (isUserDeleted) {
              toast.error('Votre compte a été supprimé');
            } else {
              toast.info('Session expirée, veuillez vous reconnecter');
            }
          }).catch(() => {
            // Le toast n'est pas disponible, mais on continue
          });
        } catch (e) {
          // Ignorer les erreurs de toast
        }
        
        // Redirection après un court délai pour permettre l'affichage du message
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } else if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.error || error.message || '';
      const isUserDeleted = errorMessage.includes('User not found') || 
                            errorMessage.includes('not found with email');
      
      if (isUserDeleted) {
        console.warn('Erreur 500 due à utilisateur supprimé, nettoyage des cookies');
        clearAuthCookies();
        
        // Afficher un message d'erreur
        try {
          import('sonner').then(({ toast }) => {
            toast.error('Votre compte a été supprimé');
          }).catch(() => {
            // Le toast n'est pas disponible
          });
        } catch (e) {
          // Ignorer les erreurs de toast
        }
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
