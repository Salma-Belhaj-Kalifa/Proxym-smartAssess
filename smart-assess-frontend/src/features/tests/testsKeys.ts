export const testKeys = {
  all: ['tests'] as const,
  details: (id: number) => ['tests', id] as const,
  generate: ['generate-test'] as const,
  submit: (token: string) => ['test-submit', token] as const,
  results: (token: string) => ['test-results', token] as const,
  public: (token: string) => ['public-test', token] as const,
};