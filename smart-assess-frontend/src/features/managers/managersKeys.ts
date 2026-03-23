export const managersKeys = {
  all: ['managers'] as const,
  details: (id: number) => [...managersKeys.all, id] as const,
  profile: (id: number) => [...managersKeys.all, 'profile', id] as const,
};
