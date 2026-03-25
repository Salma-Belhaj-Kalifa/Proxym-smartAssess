export const positionKeys = {
  all: ['positions'] as const,
  details: (id: number) => ['positions', id] as const
};