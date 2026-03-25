import { useQuery } from '@tanstack/react-query';
import { candidaturesService } from './candidaturesService';
import { candidaturesKeys } from './candidaturesKeys';
import { queryOptions } from '@/lib/queryClient';

export const useCandidatures = () => {
  return useQuery({
    queryKey: candidaturesKeys.all,
    queryFn: candidaturesService.getAll,
    ...queryOptions.fresh,
  });
};

export const useCandidature = (id: number) => {
  return useQuery({
    queryKey: candidaturesKeys.details(id),
    queryFn: () => candidaturesService.getById(id),
    ...queryOptions.stable,
    enabled: !!id,
  });
};

export const useCandidaturesByPosition = (positionId: number) => {
  return useQuery({
    queryKey: candidaturesKeys.byPosition(positionId),
    queryFn: () => candidaturesService.getByPosition(positionId),
    ...queryOptions.stable,
    enabled: !!positionId,
  });
};

export const useCandidaturesByCandidate = (candidateId: number) => {
  return useQuery({
    queryKey: candidaturesKeys.byCandidate(candidateId),
    queryFn: () => candidaturesService.getByCandidate(candidateId),
    ...queryOptions.stable,
    enabled: !!candidateId,
  });
};