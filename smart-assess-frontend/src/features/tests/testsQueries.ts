import { useQuery } from '@tanstack/react-query';
import { testService } from './testsService';
import { testKeys } from './testsKeys';
import { queryOptions } from '@/lib/queryClient';

export const useTests = () => {
  return useQuery({
    queryKey: testKeys.all,
    queryFn: testService.getAll,
    ...queryOptions.stable,
  });
};

export const useTest = (id: number) => {
  return useQuery({
    queryKey: testKeys.details(id),
    queryFn: () => testService.getById(id),
    ...queryOptions.stable,
  });
};

export const useGenerateTest = () => {
  return useQuery({
    queryKey: testKeys.generate,
    queryFn: testService.generateTest,
    ...queryOptions.stable,
  });
};

export const useGetPublicTest = (token: string) => {
  return useQuery({
    queryKey: testKeys.public(token),
    queryFn: () => testService.getPublicTest(token),
    ...queryOptions.stable,
    enabled: !!token,
  });
};

export const useGetTestResults = (token: string) => {
  return useQuery({
    queryKey: testKeys.results(token),
    queryFn: () => testService.getTestResults(token),
    ...queryOptions.stable,
    enabled: !!token,
  });
};