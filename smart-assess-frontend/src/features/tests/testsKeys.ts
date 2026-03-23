export const testsKeys = {
  all: ['tests'] as const,
  details: (id: number) => [...testsKeys.all, id] as const,
  results: (id: number) => [...testsKeys.all, 'results', id] as const,
  review: (id: number) => [...testsKeys.all, 'review', id] as const,
};
