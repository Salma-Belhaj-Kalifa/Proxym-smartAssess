import { useCallback } from 'react';
import { clearAuthCookies } from '@/utils/cookies';
import { useQueryClient } from '@/hooks/useQueryClient';

/**
 * Hook personnalisé pour gérer le nettoyage complet de l'authentification
 * Utilisé pour les déconnexions manuelles et automatiques
 */
export const useAuthCleanup = () => {
  const queryClient = useQueryClient();

  /**
   * Nettoie complètement l'état d'authentification
   * - Supprime tous les cookies
   * - Vide le cache React Query
   * - Redirige vers la page d'accueil
   */
  const cleanupAuth = useCallback((redirectUrl: string = '/') => {
    console.log('🧹 Nettoyage complet de l\'authentification...');
    
    // 1. Nettoyer tous les cookies d'authentification
    clearAuthCookies();
    
    // 2. Vider complètement le cache React Query
    queryClient.clear();
    
    // 3. Nettoyer le sessionStorage (si utilisé)
    sessionStorage.clear();
    
    // 4. Rediriger l'utilisateur
    if (redirectUrl) {
      console.log('🔄 Redirection vers:', redirectUrl);
      window.location.href = redirectUrl;
    }
  }, [queryClient]);

  /**
   * Déconnexion manuelle avec message de succès
   */
  const manualLogout = useCallback((redirectUrl: string = '/') => {
    console.log('👋 Déconnexion manuelle initiée par l\'utilisateur');
    
    // Afficher un message de succès (si toast est disponible)
    try {
      const { toast } = require('sonner');
      toast.success('Déconnexion réussie');
    } catch (error) {
      console.log('Toast non disponible, mais la déconnexion continue');
    }
    
    // Nettoyer et rediriger
    cleanupAuth(redirectUrl);
  }, [cleanupAuth]);

  /**
   * Déconnexion automatique (session expirée, erreur 401, etc.)
   */
  const autoLogout = useCallback((reason: string = 'Session expirée') => {
    console.warn(`⚠️ Déconnexion automatique: ${reason}`);
    
    // Afficher un message d'information
    try {
      const { toast } = require('sonner');
      toast.info(`Session terminée: ${reason}`);
    } catch (error) {
      console.log('Toast non disponible, mais la déconnexion continue');
    }
    
    // Nettoyer et rediriger avec un léger délai pour le message
    setTimeout(() => {
      cleanupAuth('/');
    }, 1000);
  }, [cleanupAuth]);

  /**
   * Déconnexion d'urgence (erreur critique, sécurité)
   */
  const emergencyLogout = useCallback((reason: string = 'Erreur de sécurité') => {
    console.error(`🚨 Déconnexion d'urgence: ${reason}`);
    
    // Nettoyer immédiatement sans message
    cleanupAuth('/');
  }, [cleanupAuth]);

  return {
    cleanupAuth,
    manualLogout,
    autoLogout,
    emergencyLogout,
  };
};
