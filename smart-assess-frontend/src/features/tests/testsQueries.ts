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

export const useGetPublicTest = (token: string) => {
  return useQuery({
    queryKey: testKeys.public(token),
    queryFn: () => testService.getPublicTest(token),
    ...queryOptions.stable,
    enabled: !!token,
  });
};

export const useGetTestResults = (testId: number) => {
  return useQuery({
    queryKey: testKeys.results(testId.toString()),
    queryFn: () => testService.getTestResults(testId),
    ...queryOptions.stable,
    enabled: !!testId,
  });
};

export const useTestReview = (id: number) => {
  return useQuery({
    queryKey: testKeys.details(id),
    queryFn: () => testService.getTestForReview(id),
    ...queryOptions.stable,
    enabled: !!id,
  });
};