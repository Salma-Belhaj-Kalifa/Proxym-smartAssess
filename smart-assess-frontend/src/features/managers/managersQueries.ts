import { useQuery } from '@tanstack/react-query';
import { managersService } from './managersService';
import { managersKeys } from './managersKeys';
import { queryOptions } from '@/lib/queryClient';

export const useManagers = () => {
  return useQuery({
    queryKey: managersKeys.all,
    queryFn: managersService.getAll,
    ...queryOptions.fresh,
  });
};

export const useManager = (id: number) => {
  return useQuery({
    queryKey: managersKeys.details(id),
    queryFn: () => managersService.getById(id),
    ...queryOptions.stable,
    enabled: !!id,
  });
};

export const useManagerProfile = (userId: number) => {
  return useQuery({
    queryKey: managersKeys.profile(userId),
    queryFn: () => managersService.getProfile(userId),
    ...queryOptions.stable,
    enabled: !!userId,
  });
};