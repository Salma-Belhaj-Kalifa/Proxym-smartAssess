export const hrKeys = {
  all: ['hr'] as const,
  details: (id: number) => [...hrKeys.all, id] as const,
  candidates: () => [...hrKeys.all, 'candidates'] as const,
  positions: () => [...hrKeys.all, 'positions'] as const,
  reports: () => [...hrKeys.all, 'reports'] as const,
};
