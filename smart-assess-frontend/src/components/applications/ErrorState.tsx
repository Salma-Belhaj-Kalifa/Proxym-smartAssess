import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error?: Error;
  onRetry?: () => void;
  message?: string;
}

export default function ErrorState({ error, onRetry, message }: ErrorStateProps) {
  const errorMessage = message || error?.message || 'Erreur lors du chargement des candidatures';

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="w-5 h-5" />
        <span>{errorMessage}</span>
      </div>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          size="sm" 
          className="mt-2"
        >
          Réessayer
        </Button>
      )}
    </div>
  );
}
