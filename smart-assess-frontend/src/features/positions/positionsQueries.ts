import { useQuery } from '@tanstack/react-query';
import { positionService } from './positionsService';
import { positionKeys } from './positionsKeys';
import { queryOptions } from '@/lib/queryClient';

export const usePositions = () => {
  return useQuery({
    queryKey: positionKeys.all,
    queryFn: positionService.getAll,
    ...queryOptions.stable,
  });
};

export const usePosition = (id: number) => {
  return useQuery({
    queryKey: positionKeys.details(id),
    queryFn: () => positionService.getById(id),
    ...queryOptions.stable,
  });
};