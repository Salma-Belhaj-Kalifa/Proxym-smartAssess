export const positionsKeys = {
  all: ['positions'] as const,
  details: (id: number) => [...positionsKeys.all, id] as const,
};