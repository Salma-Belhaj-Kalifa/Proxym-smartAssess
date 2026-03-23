export const cvAnalysisKeys = {
  all: ['cv-analysis'] as const,
  details: (candidateId: number) => [...cvAnalysisKeys.all, candidateId] as const,
};
