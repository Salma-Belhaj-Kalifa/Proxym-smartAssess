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
      toast.error('Erreur lors de l\'analyse du CV');
    },
  });
};