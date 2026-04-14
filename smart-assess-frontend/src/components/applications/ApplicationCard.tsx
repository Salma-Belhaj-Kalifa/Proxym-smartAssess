import { Briefcase, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Position {
  id: number;
  title: string;
  company: string;
  createdAt: string;
}

interface Application {
  id: number;
  positions: Position[];
  status: string;
  appliedDate: string;
  lastUpdate: string;
}

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Acceptée': return 'bg-green-100 text-green-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Rejetée': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Acceptée': return <CheckCircle className="w-4 h-4" />;
      case 'En cours': return <Clock className="w-4 h-4" />;
      case 'Rejetée': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Ma Candidature</CardTitle>
            <p className="text-sm text-gray-600 mb-2">
              {application.positions.length} poste{application.positions.length > 1 ? 's' : ''}
            </p>
          </div>
          <Badge className={getStatusColor(application.status)}>
            <div className="flex items-center gap-2">
              {getStatusIcon(application.status)}
              {application.status}
            </div>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Afficher tous les postes */}
          <div>
            <span className="text-sm text-gray-500">Poste{application.positions.length > 1 ? 's' : ''}:</span>
            <div className="mt-1 space-y-1">
              {application.positions.map((position, index) => (
                <div key={position.id} className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{position.title}</span>
                  {position.company && (
                    <span className="text-sm text-gray-600">({position.company})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date de candidature:</span>
            <span className="font-medium">{formatDate(application.appliedDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
