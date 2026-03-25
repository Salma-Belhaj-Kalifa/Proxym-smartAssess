export const managersKeys = {
  all: ['managers'] as const,
  details: (id: number) => ['managers', id] as const,
  profile: (id: number) => ['managers', 'profile', id] as const,
};