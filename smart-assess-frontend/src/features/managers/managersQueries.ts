import { useQuery } from '@tanstack/react-query';
import { managersService } from './managersService';
import { managersKeys } from './managersKeys';
import { Manager } from './types';
import { queryOptions } from '@/lib/queryClient';

export const useManagers = () =>
  useQuery<Manager[]>({
    queryKey: managersKeys.all,
    queryFn: managersService.getAll,
    ...queryOptions.stable, 
  });

export const useManager = (id: number) =>
  useQuery<Manager>({
    queryKey: managersKeys.details(id),
    queryFn: () => managersService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });

export const useManagerProfile = (id: number) =>
  useQuery<Manager>({
    queryKey: managersKeys.profile(id),
    queryFn: () => managersService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });
