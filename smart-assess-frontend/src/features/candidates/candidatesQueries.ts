import { useQuery } from '@tanstack/react-query';
import { candidatesService } from './candidatesService';
import { candidatesKeys } from './candidatesKeys';
import { Candidate } from './types';

export const useCandidates = () =>
  useQuery<Candidate[]>({
    queryKey: candidatesKeys.all,
    queryFn: candidatesService.getAll,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

export const useCandidate = (id: number) =>
  useQuery<Candidate>({
    queryKey: candidatesKeys.details(id),
    queryFn: () => candidatesService.getById(id),
    enabled: !!id,
  });

export const useCandidateProfile = (id: number) =>
  useQuery<Candidate>({
    queryKey: candidatesKeys.profile(id),
    queryFn: () => candidatesService.getById(id),
    enabled: !!id,
  });
