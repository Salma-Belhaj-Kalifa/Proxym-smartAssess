import { useQuery } from '@tanstack/react-query';
import { hrService } from './hrService';
import { hrKeys } from './hrKeys';
import type { HR, HRReport, HRMetrics } from './types';
import { queryOptions } from '@/lib/queryClient';

export const useHRList = () =>
  useQuery<HR[]>({
    queryKey: hrKeys.all,
    queryFn: hrService.getAll,
    ...queryOptions.stable, 
  });

export const useHR = (id: number) =>
  useQuery<HR>({
    queryKey: hrKeys.details(id),
    queryFn: () => hrService.getById(id),
    ...queryOptions.stable, 
    enabled: !!id,
  });

export const useHRReports = () =>
  useQuery<HRReport[]>({
    queryKey: hrKeys.reports(),
    queryFn: hrService.getReports,
    ...queryOptions.fresh, 
  });

export const useHRMetrics = () =>
  useQuery<HRMetrics>({
    queryKey: [hrKeys.all, 'metrics'],
    queryFn: hrService.getMetrics,
    ...queryOptions.realtime, 
  });

export const useHRDashboard = () =>
  useQuery({
    queryKey: [hrKeys.all, 'dashboard'],
    queryFn: hrService.getDashboardData,
    ...queryOptions.fresh, 
  });
