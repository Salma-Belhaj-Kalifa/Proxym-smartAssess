import { useQuery } from '@tanstack/react-query';
import { testsService } from './testsService';
import { testsKeys } from './testsKeys';
import type { Test, TestResult } from './types';
import { queryOptions } from '@/lib/queryClient';

export const useTests = () =>
  useQuery<Test[]>({
    queryKey: testsKeys.all,
    queryFn: testsService.getAll,
    ...queryOptions.stable, 
  });

export const useTest = (id: number) =>
  useQuery<Test>({
    queryKey: testsKeys.details(id),
    queryFn: () => testsService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });

export const useTestResults = (testId: number) =>
  useQuery<TestResult[]>({
    queryKey: testsKeys.results(testId),
    queryFn: () => testsService.getResults(testId),
    ...queryOptions.stable, 
    enabled: !!testId,
  });

export const useTestForReview = (testId: number) =>
  useQuery<Test>({
    queryKey: testsKeys.review(testId),
    queryFn: () => testsService.getForReview(testId),
    ...queryOptions.stable, 
    enabled: !!testId,
  });
