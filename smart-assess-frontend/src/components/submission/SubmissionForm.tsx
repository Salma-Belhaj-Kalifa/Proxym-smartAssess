import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface SubmissionFormProps {
  file: File | null;
  selectedPositions: number[];
  onSubmit: () => void;
  isUploading: boolean;
  uploadProgress: number;
  submitStatus: 'idle' | 'uploading' | 'success' | 'error';
  error: string | null;
}

export default function SubmissionForm({ 
  file, 
  selectedPositions, 
  onSubmit, 
  isUploading, 
  uploadProgress, 
  submitStatus, 
  error 
}: SubmissionFormProps) {
  const handleSubmit = async () => {
    if (!file) {
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="space-y-6">
      {/* Validation du fichier */}
      {file && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <span className="font-medium">Fichier prêt:</span>
            <span className="text-sm">{file.name}</span>
          </div>
        </div>
      )}

      {/* Validation des positions */}
      {selectedPositions.length === 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-yellow-700">
            <span className="font-medium">Veuillez sélectionner au moins une position</span>
          </div>
        </div>
      )}

      {/* Bouton de soumission */}
      <Button
        onClick={handleSubmit}
        disabled={!file || selectedPositions.length === 0 || isUploading}
        className="w-full"
        size="lg"
      >
        {isUploading ? (
          <>
            <span className="animate-pulse">Soumission en cours...</span>
            {uploadProgress > 0 && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="w-full" />
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
            )}
          </>
        ) : (
          'Soumettre la candidature'
        )}
      </Button>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-red-700">
            <span className="font-medium">Erreur:</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
