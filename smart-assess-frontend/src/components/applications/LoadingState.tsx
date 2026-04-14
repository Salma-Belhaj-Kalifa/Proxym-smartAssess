import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Chargement des candidatures..." }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}
