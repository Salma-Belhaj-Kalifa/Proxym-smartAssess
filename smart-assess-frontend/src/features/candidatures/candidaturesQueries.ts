import { useQuery } from '@tanstack/react-query';
import { candidaturesService } from './candidaturesService';
import { candidaturesKeys } from './candidaturesKeys';
import type { Candidature } from './types';
import { queryOptions } from '@/lib/queryClient';

export const useCandidatures = () =>
  useQuery<Candidature[]>({
    queryKey: candidaturesKeys.all,
    queryFn: candidaturesService.getAll,
    ...queryOptions.fresh, 
  });

export const useCandidature = (id: number) =>
  useQuery<Candidature>({
    queryKey: candidaturesKeys.details(id),
    queryFn: () => candidaturesService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });

export const useCandidaturesByPosition = (positionId: number) =>
  useQuery<Candidature[]>({
    queryKey: candidaturesKeys.byPosition(positionId),
    queryFn: () => candidaturesService.getByPosition(positionId),
    ...queryOptions.stable, 
    enabled: !!positionId,
  });

export const useCandidaturesByCandidate = (candidateId: number) =>
  useQuery<Candidature[]>({
    queryKey: candidaturesKeys.byCandidate(candidateId),
    queryFn: () => candidaturesService.getByCandidate(candidateId),
    ...queryOptions.stable, 
    enabled: !!candidateId,
  });
