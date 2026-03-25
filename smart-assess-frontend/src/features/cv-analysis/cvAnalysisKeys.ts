export const cvAnalysisKeys = {
  all: ['cv-analysis'] as const,
  details: (id: number) => ['cv-analysis', id] as const,
  byCandidate: (candidateId: number) => ['cv-analysis', 'candidate', candidateId] as const,
};