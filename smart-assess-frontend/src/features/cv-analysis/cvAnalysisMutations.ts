import { useMutation } from '@tanstack/react-query';
import { cvAnalysisService } from './cvAnalysisService';
import { useQueryClient } from '@/hooks/useQueryClient';
import { cvAnalysisKeys } from './cvAnalysisKeys';
import { toast } from 'sonner';

export const useAnalyzeCV = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ candidateId, file }: { candidateId: number; file: File }) => {
      return await cvAnalysisService.analyzeCV(candidateId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cvAnalysisKeys.all });
      queryClient.invalidateQueries({ queryKey: ['candidate-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('CV analysé avec succès !');
    },
    onError: (error: any) => {
      console.error('Erreur lors de l\'analyse du CV:', error);
      
      // Gérer les différents types d'erreurs
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error('L\'analyse du CV prend trop de temps. Veuillez réessayer avec un fichier plus petit.');
      } else if (error.response?.status === 500) {
        const errorData = error.response?.data;
        if (errorData?.error?.includes('AI service')) {
          toast.error('Le service d\'analyse IA est temporairement indisponible. Veuillez réessayer plus tard.');
        } else if (errorData?.error?.includes('file size')) {
          toast.error('Le fichier est trop volumineux. Veuillez utiliser un fichier PDF de moins de 10MB.');
        } else if (errorData?.error?.includes('file format')) {
          toast.error('Format de fichier non supporté. Veuillez utiliser un fichier PDF.');
        } else {
          toast.error('Erreur serveur lors de l\'analyse du CV. Veuillez réessayer plus tard.');
        }
      } else if (error.response?.status === 413) {
        toast.error('Fichier trop volumineux. Veuillez utiliser un fichier de moins de 10MB.');
      } else if (error.response?.status === 415) {
        toast.error('Format de fichier non supporté. Veuillez utiliser un fichier PDF.');
      } else if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else {
        toast.error('Erreur lors de l\'analyse du CV. Veuillez réessayer.');
      }
    },
  });
};