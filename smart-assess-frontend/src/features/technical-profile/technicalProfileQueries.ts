import { useQuery } from '@tanstack/react-query';
import { technicalProfileService } from './technicalProfileService';
import { technicalProfileKeys } from './technicalProfileKeys';

export const useTechnicalProfile = (candidateId: number) =>
  useQuery({
    queryKey: technicalProfileKeys.details(candidateId),
    queryFn: () => technicalProfileService.getByCandidateId(candidateId),
    enabled: !!candidateId,
  });
