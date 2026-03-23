import { useQuery } from '@tanstack/react-query';
import { testsService } from './testsService';
import { testsKeys } from './testsKeys';
import type { Test, TestResult } from './types';

export const useTests = () =>
  useQuery<Test[]>({
    queryKey: testsKeys.all,
    queryFn: testsService.getAll,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

export const useTest = (id: number) =>
  useQuery<Test>({
    queryKey: testsKeys.details(id),
    queryFn: () => testsService.getById(id),
    enabled: !!id,
  });

export const useTestResults = (testId: number) =>
  useQuery<TestResult[]>({
    queryKey: testsKeys.results(testId),
    queryFn: () => testsService.getResults(testId),
    enabled: !!testId,
  });

export const useTestForReview = (testId: number) =>
  useQuery<Test>({
    queryKey: testsKeys.review(testId),
    queryFn: () => testsService.getForReview(testId),
    enabled: !!testId,
  });
