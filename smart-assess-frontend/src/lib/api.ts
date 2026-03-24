import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Fonctions pour gérer l'authentification avec localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

const getAuthUserData = () => {
  const userData = localStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

const setAuthUserData = (userData: any) => {
  localStorage.setItem('user_data', JSON.stringify(userData));
};

const removeAuthUserData = () => {
  localStorage.removeItem('user_data');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Utiliser directement l'URL du backend
  timeout: 10000,
  withCredentials: false // Désactiver les cookies pour utiliser localStorage
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken(); // Utiliser localStorage au lieu des cookies
    
    // Ne pas ajouter de token pour les requêtes d'authentification
    const isAuthRequest = config.url?.includes('/auth/login') || 
                        config.url?.includes('/auth/register') ||
                        config.url?.includes('/auth/refresh');
    
    if (!isAuthRequest) {
      // Logging pour diagnostiquer les problèmes d'authentification
      if (config.url?.includes('/users/') && config.url?.includes('/profile')) {
        console.log('Requête de profil utilisateur:', {
          url: config.url,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          headers: config.headers
        });
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('Aucun token disponible pour la requête:', config.url);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Erreur dans l\'intercepteur de requête:', error);
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
        
        // Nettoyage complet des données d'authentification (localStorage + cookies)
        removeAuthToken();
        removeAuthUserData();
        
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
        console.warn('Erreur 500 due à utilisateur supprimé, nettoyage des données d\'authentification');
        removeAuthToken();
        removeAuthUserData();
        
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

// Exporter les fonctions d'authentification pour les utiliser dans d'autres composants
export { 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken, 
  getAuthUserData, 
  setAuthUserData, 
  removeAuthUserData 
};
