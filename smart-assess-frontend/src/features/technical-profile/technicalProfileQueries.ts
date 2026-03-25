import { useQuery } from '@tanstack/react-query';
import { technicalProfileService } from './technicalProfileService';
import { technicalProfileKeys } from './technicalProfileKeys';
import { queryOptions } from '@/lib/queryClient';

export const useTechnicalProfiles = () => {
  return useQuery({
    queryKey: technicalProfileKeys.all,
    queryFn: technicalProfileService.getAll,
    ...queryOptions.fresh,
  });
};

export const useTechnicalProfile = (id: number) => {
  return useQuery({
    queryKey: technicalProfileKeys.details(id),
    queryFn: () => technicalProfileService.getById(id),
    ...queryOptions.stable,
    enabled: !!id,
  });
};

export const useTechnicalProfileByCandidate = (candidateId: number) => {
  return useQuery({
    queryKey: technicalProfileKeys.byCandidate(candidateId),
    queryFn: () => technicalProfileService.getByCandidateId(candidateId),
    ...queryOptions.stable,
    enabled: !!candidateId,
  });
};