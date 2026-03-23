import { useQuery } from '@tanstack/react-query';
import { candidaturesService } from './candidaturesService';
import { candidaturesKeys } from './candidaturesKeys';
import type { Candidature } from './types';

export const useCandidatures = () =>
  useQuery<Candidature[]>({
    queryKey: candidaturesKeys.all,
    queryFn: candidaturesService.getAll,
    staleTime: 5 * 1000,
    gcTime: 30 * 1000,
  });

export const useCandidature = (id: number) =>
  useQuery<Candidature>({
    queryKey: candidaturesKeys.details(id),
    queryFn: () => candidaturesService.getById(id),
    enabled: !!id,
  });

export const useCandidaturesByPosition = (positionId: number) =>
  useQuery<Candidature[]>({
    queryKey: candidaturesKeys.byPosition(positionId),
    queryFn: () => candidaturesService.getByPosition(positionId),
    enabled: !!positionId,
  });

export const useCandidaturesByCandidate = (candidateId: number) =>
  useQuery<Candidature[]>({
    queryKey: candidaturesKeys.byCandidate(candidateId),
    queryFn: () => candidaturesService.getByCandidate(candidateId),
    enabled: !!candidateId,
  });
