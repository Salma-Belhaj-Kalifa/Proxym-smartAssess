import { useQuery } from '@tanstack/react-query';
import { positionsKeys } from './positionsKeys';
import { positionsService } from './positionsService';
import type { Position } from './types';
import { queryOptions } from '@/lib/queryClient';

export const usePositions = () =>
  useQuery<Position[]>({
    queryKey: positionsKeys.all,
    queryFn: positionsService.getAll,
    ...queryOptions.fresh, 
  });

export const usePosition = (id: number) =>
  useQuery<Position>({
    queryKey: positionsKeys.details(id),
    queryFn: () => positionsService.getById(id),
    ...queryOptions.stable,
    enabled: !!id,
  });