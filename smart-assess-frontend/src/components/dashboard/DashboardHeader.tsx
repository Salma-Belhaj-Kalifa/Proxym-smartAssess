import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  userName?: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600">
          Bienvenue, {userName || 'Candidat'} ! Voici votre résumé.
        </p>
      </div>
      <div className="flex gap-4">
        <Link to="/candidat/postes">
          <Button className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Voir les offres
          </Button>
        </Link>
      </div>
    </div>
  );
}
