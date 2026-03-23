import { useQuery } from '@tanstack/react-query';
import { cvAnalysisService } from './cvAnalysisService';
import { cvAnalysisKeys } from './cvAnalysisKeys';
import type { CVAnalysisResult } from './types';

export const useCVAnalysis = (candidateId: number) =>
  useQuery<CVAnalysisResult>({
    queryKey: cvAnalysisKeys.details(candidateId),
    queryFn: () => cvAnalysisService.getAnalysis(candidateId),
    enabled: !!candidateId,
  });
