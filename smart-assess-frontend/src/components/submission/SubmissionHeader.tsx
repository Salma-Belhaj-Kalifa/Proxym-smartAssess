import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SubmissionHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function SubmissionHeader({ title = "Soumettre votre candidature", subtitle }: SubmissionHeaderProps) {
  return (
    <div className="text-center">
      <Link to="/candidat/postes" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour aux positions
      </Link>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-gray-600">
          {subtitle}
        </p>
      )}
    </div>
  );
}
