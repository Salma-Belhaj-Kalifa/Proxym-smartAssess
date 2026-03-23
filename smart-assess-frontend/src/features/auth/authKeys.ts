export const authKeys = {
  all: ['auth'] as const,
  user: ['auth', 'user'] as const,
  profile: (userId: number) => [...authKeys.user, 'profile', userId] as const,
};