export const candidaturesKeys = {
  all: ['candidatures'] as const,
  details: (id: number) => [...candidaturesKeys.all, id] as const,
  byPosition: (positionId: number) => [...candidaturesKeys.all, 'position', positionId] as const,
  byCandidate: (candidateId: number) => [...candidaturesKeys.all, 'candidate', candidateId] as const,
};