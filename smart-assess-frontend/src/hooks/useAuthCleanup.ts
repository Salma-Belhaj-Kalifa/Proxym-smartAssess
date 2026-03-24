import { useCallback } from 'react';
import { clearAuthCookies } from '@/utils/cookies';
import { useQueryClient } from '@/hooks/useQueryClient';

export const useAuthCleanup = () => {
  const queryClient = useQueryClient();

  const cleanupAuth = useCallback((redirectUrl: string = '/') => {
    console.log('Nettoyage complet de l\'authentification...');
    
    clearAuthCookies();
    
    queryClient.clear();
    
    sessionStorage.clear();
    
    if (redirectUrl) {
      console.log('🔄 Redirection vers:', redirectUrl);
      window.location.href = redirectUrl;
    }
  }, [queryClient]);

  /**
   * Déconnexion manuelle avec message de succès
   */
  const manualLogout = useCallback((redirectUrl: string = '/') => {
    console.log('Déconnexion manuelle initiée par l\'utilisateur');
    
    try {
      const { toast } = require('sonner');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.log('Toast non disponible, mais la déconnexion continue');
    }
    
    cleanupAuth(redirectUrl);
  }, [cleanupAuth]);

  /**
   * Déconnexion automatique (session expirée, erreur 401, etc.)
   */
  const autoLogout = useCallback((reason: string = 'Session expirée') => {
    console.warn(`Déconnexion automatique: ${reason}`);
    
    try {
      const { toast } = require('sonner');
      toast.info(`Session terminée: ${reason}`);
    } catch (error) {
      console.log('Toast non disponible, mais la déconnexion continue');
    }
    
    setTimeout(() => {
      cleanupAuth('/');
    }, 1000);
  }, [cleanupAuth]);

  /**
   * Déconnexion d'urgence (erreur critique, sécurité)
   */
  const emergencyLogout = useCallback((reason: string = 'Erreur de sécurité') => {
    console.error(`Déconnexion d'urgence: ${reason}`);
    
    cleanupAuth('/');
  }, [cleanupAuth]);

  return {
    cleanupAuth,
    manualLogout,
    autoLogout,
    emergencyLogout,
  };
};
