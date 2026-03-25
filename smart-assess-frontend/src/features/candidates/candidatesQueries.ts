import { useQuery } from '@tanstack/react-query';
import { candidateService } from './candidatesService';
import { candidateKeys } from './candidatesKeys';
import { queryOptions } from '@/lib/queryClient';

export const useCandidates = () => {
  return useQuery({
    queryKey: candidateKeys.all,
    queryFn: candidateService.getAll,
    ...queryOptions.stable,
  });
};

export const useCandidate = (id: number) => {
  return useQuery({
    queryKey: candidateKeys.details(id),
    queryFn: () => candidateService.getById(id),
    ...queryOptions.stable,
  });
};