import { useQuery } from '@tanstack/react-query';
import { cvAnalysisService } from './cvAnalysisService';
import { cvAnalysisKeys } from './cvAnalysisKeys';
import { queryOptions } from '@/lib/queryClient';

export const useCVAnalyses = () => {
  return useQuery({
    queryKey: cvAnalysisKeys.all,
    queryFn: cvAnalysisService.getAll,
    ...queryOptions.fresh,
  });
};

export const useCVAnalysis = (id: number) => {
  return useQuery({
    queryKey: cvAnalysisKeys.details(id),
    queryFn: () => cvAnalysisService.getById(id),
    ...queryOptions.stable,
    enabled: !!id,
  });
};

export const useCVAnalysesByCandidate = (candidateId: number) => {
  return useQuery({
    queryKey: cvAnalysisKeys.byCandidate(candidateId),
    queryFn: () => cvAnalysisService.getByCandidate(candidateId),
    ...queryOptions.stable,
    enabled: !!candidateId,
  });
};