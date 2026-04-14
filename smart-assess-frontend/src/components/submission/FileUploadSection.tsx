import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadSectionProps {
  file: File | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUploadSection({ file, onFileChange }: FileUploadSectionProps) {
  return (
    <div>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={onFileChange}
        className="hidden"
        id="cv-upload"
      />
      <label htmlFor="cv-upload">
        <Button asChild>
          <span className="cursor-pointer">
            {file ? 'Changer de fichier' : 'Sélectionner un fichier'}
          </span>
        </Button>
      </label>
      
      {file && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <FileText className="w-4 h-4" />
            <span className="font-medium">Fichier sélectionné: {file.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
