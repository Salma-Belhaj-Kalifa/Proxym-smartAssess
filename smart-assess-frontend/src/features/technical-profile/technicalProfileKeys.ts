export const technicalProfileKeys = {
  all: ['technical-profile'] as const,
  details: (userId: number) => [...technicalProfileKeys.all, userId] as const,
  skills: (userId: number) => [...technicalProfileKeys.all, 'skills', userId] as const,
  experience: (userId: number) => [...technicalProfileKeys.all, 'experience', userId] as const,
  education: (userId: number) => [...technicalProfileKeys.all, 'education', userId] as const,
  certifications: (userId: number) => [...technicalProfileKeys.all, 'certifications', userId] as const,
  projects: (userId: number) => [...technicalProfileKeys.all, 'projects', userId] as const,
};
