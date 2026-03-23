import { useQuery } from '@tanstack/react-query';
import { hrService } from './hrService';
import { hrKeys } from './hrKeys';
import type { HR, HRReport, HRMetrics } from './types';

export const useHRList = () =>
  useQuery<HR[]>({
    queryKey: hrKeys.all,
    queryFn: hrService.getAll,
    staleTime: 5 * 60 * 1000,
  });

export const useHR = (id: number) =>
  useQuery<HR>({
    queryKey: hrKeys.details(id),
    queryFn: () => hrService.getById(id),
    enabled: !!id,
  });

export const useHRReports = () =>
  useQuery<HRReport[]>({
    queryKey: hrKeys.reports(),
    queryFn: hrService.getReports,
    staleTime: 2 * 60 * 1000,
  });

export const useHRMetrics = () =>
  useQuery<HRMetrics>({
    queryKey: [hrKeys.all, 'metrics'],
    queryFn: hrService.getMetrics,
    staleTime: 1 * 60 * 1000,
  });

export const useHRDashboard = () =>
  useQuery({
    queryKey: [hrKeys.all, 'dashboard'],
    queryFn: hrService.getDashboardData,
    staleTime: 30 * 1000,
  });
