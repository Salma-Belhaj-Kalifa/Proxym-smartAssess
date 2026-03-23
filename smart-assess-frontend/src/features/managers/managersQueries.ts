import { useQuery } from '@tanstack/react-query';
import { managersService } from './managersService';
import { managersKeys } from './managersKeys';
import { Manager } from './types';

export const useManagers = () =>
  useQuery<Manager[]>({
    queryKey: managersKeys.all,
    queryFn: managersService.getAll,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

export const useManager = (id: number) =>
  useQuery<Manager>({
    queryKey: managersKeys.details(id),
    queryFn: () => managersService.getById(id),
    enabled: !!id,
  });

export const useManagerProfile = (id: number) =>
  useQuery<Manager>({
    queryKey: managersKeys.profile(id),
    queryFn: () => managersService.getById(id),
    enabled: !!id,
  });
