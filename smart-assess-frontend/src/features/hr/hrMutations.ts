import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from './hrService';
import { hrKeys } from './hrKeys';
import { toast } from 'sonner';
import type { HR, HRReport } from './types';

export const useCreateHR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrKeys.all });
      toast.success('HR créé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création du HR');
    }
  });
};

export const useUpdateHR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HR> }) => {
      return await hrService.update(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: hrKeys.all });
      queryClient.invalidateQueries({ queryKey: hrKeys.details(id) });
      toast.success('HR mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour du HR');
    }
  });
};

export const useDeleteHR = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: hrService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrKeys.all });
      toast.success('HR supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la suppression du HR');
    }
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, filters }: { type: string; filters?: any }) => {
      return await hrService.generateReport(type, filters);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hrKeys.reports() });
      toast.success('Rapport généré avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la génération du rapport');
    }
  });
};

export const useDownloadReport = () => {
  return useMutation({
    mutationFn: hrService.downloadReport,
    onSuccess: (blob, reportId) => {
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Rapport téléchargé');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du téléchargement du rapport');
    }
  });
};
