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
      
      // Logging spécifique pour les technical profiles
      if (config.url?.includes('/technical-profiles')) {
        console.log('=== TECHNICAL PROFILE REQUEST ===');
        console.log('URL:', config.url);
        console.log('Method:', config.method);
        console.log('Has Token:', !!token);
        console.log('Token Length:', token?.length || 0);
        console.log('Headers:', config.headers);
        console.log('=== END TECHNICAL PROFILE REQUEST ===');
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
    // Logging spécifique pour les technical profiles réussis
    if (response.config.url?.includes('/technical-profiles')) {
      console.log('=== TECHNICAL PROFILE SUCCESS ===');
      console.log('URL:', response.config.url);
      console.log('Status:', response.status);
      console.log('Data Type:', typeof response.data);
      console.log('Data Keys:', response.data ? Object.keys(response.data) : 'No data');
      console.log('=== END TECHNICAL PROFILE SUCCESS ===');
    }
    return response;
  },
  (error) => {
    // Logging spécifique pour les erreurs 500 de technical profiles
    if (error.config?.url?.includes('/technical-profiles') && error.response?.status === 500) {
      console.log('=== TECHNICAL PROFILE ERROR 500 ===');
      console.log('URL:', error.config.url);
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Error Data:', error.response.data);
      console.log('Request Headers:', error.config.headers);
      console.log('=== END TECHNICAL PROFILE ERROR 500 ===');
    }
    
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
        
        // Redirection vers la page de connexion appropriée selon le contexte actuel
        setTimeout(() => {
          // Vérifier si nous sommes sur une page manager ou candidat
          const currentPath = window.location.pathname;
          if (currentPath.includes('/manager')) {
            window.location.href = '/recruteur/connexion';
          } else if (currentPath.includes('/candidat')) {
            window.location.href = '/candidat/connexion';
          } else {
            window.location.href = '/'; // Page d'accueil par défaut
          }
        }, 1500);
      }
    } else if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.error || error.message || '';
      const isUserDeleted = errorMessage.includes('User not found') || 
                            errorMessage.includes('not found with email');
      const isAuthEndpoint = error.config?.url?.includes('/auth/me');
      
      if (isUserDeleted && !isAuthEndpoint) {
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
      } else if (isAuthEndpoint) {
        // Pour les erreurs 500 sur /auth/me, ne pas nettoyer le token mais logguer l'erreur
        console.warn('Erreur 500 sur endpoint /auth/me, probablement un problème temporaire du backend');
        // Ne pas nettoyer le token, laisser React Query gérer les retry limités
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
