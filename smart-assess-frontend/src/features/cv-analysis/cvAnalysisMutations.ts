import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cvAnalysisService } from './cvAnalysisService';
import { cvAnalysisKeys } from './cvAnalysisKeys';
import { toast } from 'sonner';
import type { CVAnalysisResult } from './types';

export const useAnalyzeCV = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      return await cvAnalysisService.analyzeCV(file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cvAnalysisKeys.all });
      toast.success('CV analysé avec succès');
    },
    onError: (error: any) => {
      console.error('Error analyzing CV:', error);
      toast.error('Erreur lors de l\'analyse du CV');
    }
  });
};

export const useUploadCV = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ candidateId, file }: { candidateId: number; file: File }) => {
      return await cvAnalysisService.uploadCV(candidateId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cvAnalysisKeys.all });
      toast.success('CV téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors du téléchargement du CV');
    }
  });
};
