import { Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApplicationsHeaderProps {
  onViewOffers?: () => void;
}

export default function ApplicationsHeader({ onViewOffers }: ApplicationsHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Mes candidatures</h1>
      <div className="flex gap-4">
        <Link to="/candidat/postes">
          <Button variant="outline" className="flex items-center gap-2" onClick={onViewOffers}>
            <Briefcase className="w-4 h-4" />
            Voir les offres
          </Button>
        </Link>
      </div>
    </div>
  );
}
