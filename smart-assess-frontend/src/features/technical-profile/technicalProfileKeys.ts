export const technicalProfileKeys = {
  all: ['technical-profiles'] as const,
  details: (id: number) => ['technical-profiles', id] as const,
  byCandidate: (candidateId: number) => ['technical-profiles', 'candidate', candidateId] as const,
};