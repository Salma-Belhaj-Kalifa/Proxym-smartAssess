import { useQuery } from '@tanstack/react-query';
import { authService } from './authService';
import { authKeys } from './authKeys';
import { queryOptions } from '@/lib/queryClient';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authService.getCurrentUser,
    ...queryOptions.stable,
  });
};