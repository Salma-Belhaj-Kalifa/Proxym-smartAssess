import { Progress } from '@/components/ui/progress';

interface FileUploadProgressProps {
  progress: number;
  isVisible: boolean;
}

export default function FileUploadProgress({ progress, isVisible }: FileUploadProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Progression du téléchargement</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
