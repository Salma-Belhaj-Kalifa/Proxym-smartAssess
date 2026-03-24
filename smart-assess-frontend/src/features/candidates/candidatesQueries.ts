import { useQuery } from '@tanstack/react-query';
import { candidatesService } from './candidatesService';
import { candidatesKeys } from './candidatesKeys';
import { Candidate } from './types';
import { queryOptions } from '@/lib/queryClient';

export const useCandidates = () =>
  useQuery<Candidate[]>({
    queryKey: candidatesKeys.all,
    queryFn: candidatesService.getAll,
    ...queryOptions.stable, 
  });

export const useCandidate = (id: number) =>
  useQuery<Candidate>({
    queryKey: candidatesKeys.details(id),
    queryFn: () => candidatesService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });

export const useCandidateProfile = (id: number) =>
  useQuery<Candidate>({
    queryKey: candidatesKeys.profile(id),
    queryFn: () => candidatesService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });
