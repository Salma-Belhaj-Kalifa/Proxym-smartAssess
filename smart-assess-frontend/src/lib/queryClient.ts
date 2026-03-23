import { QueryClient } from '@tanstack/react-query';

/**
 * Configuration centralisée du QueryClient
 * 
 * Options par défaut :
 * - staleTime: 5 minutes - Les données sont considérées fraîches pendant 5 minutes
 * - gcTime: 10 minutes - Les données inutilisées sont gardées en cache pendant 10 minutes
 * - retry: 3 tentatives en cas d'erreur
 * - retryDelay: Délai exponentiel entre les tentatives
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Les données sont considérées fraîches pendant 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes en millisecondes
      
      // Les données inutilisées sont gardées en cache pendant 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes en millisecondes (anciennement cacheTime)
      
      // Nombre de tentatives de retry en cas d'erreur
      retry: 3,
      
      // Délai exponentiel entre les tentatives de retry
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Ne pas refetcher à chaque focus de fenêtre si les données sont fraîches
      refetchOnWindowFocus: false,
      
      // Refetcher en cas de reconnexion réseau
      refetchOnReconnect: true,
      
      // Refetcher si le composant est monté et les données sont stale
      refetchOnMount: true,
    },
    mutations: {
      // Pas de retry pour les mutations par défaut (pour éviter les créations dupliquées)
      retry: 0,
    },
  },
});

/**
 * Options par défaut pour les requêtes spécifiques
 */
export const queryOptions = {
  // Pour les données qui changent fréquemment (notifications, etc.)
  fresh: {
    staleTime: 0, // Toujours considéré comme stale
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  },
  
  // Pour les données relativement stables (profil utilisateur, etc.)
  stable: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  },
  
  // Pour les données très stables (références, etc.)
  veryStable: {
    staleTime: 60 * 60 * 1000, // 1 heure
    gcTime: 2 * 60 * 60 * 1000, // 2 heures
    refetchOnWindowFocus: false,
  },
  
  // Pour les requêtes en temps réel
  realtime: {
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch toutes les 30 secondes
    refetchOnWindowFocus: true,
  },
} as const;

/**
 * Helper pour créer des options de requête personnalisées
 */
export const createQueryOptions = (options: {
  staleTime?: number;
  gcTime?: number;
  retry?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
}) => ({
  ...queryClient.getDefaultOptions().queries,
  ...options,
});

export default queryClient;
