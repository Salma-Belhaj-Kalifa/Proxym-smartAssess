export const candidateKeys = {
  all: ['candidates'] as const,
  details: (id: number) => ['candidates', id] as const,
};