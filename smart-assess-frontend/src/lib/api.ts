import axios from 'axios';

// Configuration de l'API backend
const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL, // Utiliser directement l'URL du backend
  timeout: 10000
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Ne pas rediriger automatiquement pour les erreurs 401 de login
    // Laisser les pages de connexion gérer les erreurs elles-mêmes
    if (error.response?.status === 401) {
      // Vérifier si c'est une requête de login/register
      const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                           error.config?.url?.includes('/auth/register');
      
      if (!isAuthRequest) {
        // Vérifier si l'erreur est due à un utilisateur supprimé
        const errorMessage = error.response?.data?.error || error.message || '';
        const isUserDeleted = errorMessage.includes('User not found') || 
                              errorMessage.includes('not found with email');
        
        console.warn('Erreur 401 détectée:', {
          url: error.config?.url,
          isAuthRequest,
          isUserDeleted,
          errorMessage
        });
        
        // Nettoyer le localStorage dans tous les cas de 401 non-auth
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Rediriger vers la page d'accueil
        window.location.href = '/';
      }
    } else if (error.response?.status === 500) {
      // Vérifier si l'erreur 500 est due à un utilisateur supprimé
      const errorMessage = error.response?.data?.error || error.message || '';
      const isUserDeleted = errorMessage.includes('User not found') || 
                            errorMessage.includes('not found with email');
      
      if (isUserDeleted) {
        console.warn('Erreur 500 due à utilisateur supprimé, nettoyage du localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
