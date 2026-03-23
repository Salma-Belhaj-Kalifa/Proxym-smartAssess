import { useQueryClient as useTanStackQueryClient } from '@tanstack/react-query';
import { queryClient as globalQueryClient } from '@/lib/queryClient';

/**
 * Hook pour utiliser le QueryClient centralisé
 * 
 * Ce hook garantit que tous les composants utilisent la même instance
 * de QueryClient avec la configuration centralisée.
 */
export const useQueryClient = () => {
  // Utiliser l'instance globale du QueryClient
  // Cela garantit que tous les hooks utilisent la même configuration
  return globalQueryClient;
};

/**
 * Export direct du QueryClient pour les cas d'usage hors des composants React
 */
export { queryClient } from '@/lib/queryClient';

/**
 * Export des options de requête prédéfinies
 */
export { queryOptions, createQueryOptions } from '@/lib/queryClient';

export default useQueryClient;
