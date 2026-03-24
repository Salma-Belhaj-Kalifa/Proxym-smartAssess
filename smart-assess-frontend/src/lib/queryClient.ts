import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});


export const queryOptions = {
  fresh: { staleTime: 0, gcTime: 2 * 60 * 1000 },
  stable: { staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  realtime: { staleTime: 30 * 1000, refetchInterval: 30 * 1000 },
} as const;

export { queryClient };
export default queryClient;
