export const candidatesKeys = {
  all: ['candidates'] as const,
  details: (id: number) => [...candidatesKeys.all, id] as const,
  profile: (id: number) => [...candidatesKeys.all, 'profile', id] as const,
};
