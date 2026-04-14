import { Briefcase, Clock, Calendar, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Position {
  id: number;
  title: string;
  company: string;
  appliedAt: string;
}

interface Application {
  id: number;
  candidateId: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  positions: Position[];
  status: string;
  appliedDate: string;
  lastUpdate: string;
}

interface ApplicationStatusCardProps {
  application: Application;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  getTimeSinceApplied: (appliedDate: string) => string;
}

export default function ApplicationStatusCard({ 
  application, 
  getStatusColor, 
  getStatusIcon, 
  formatDate, 
  getTimeSinceApplied 
}: ApplicationStatusCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
      <CardContent className="p-0">
        <div className="flex">
          {/* Bande latérale de statut */}
          <div className={`w-1 ${getStatusColor(application.status).split(' ')[0]}`}></div>
          
          {/* Contenu principal */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* En-tête avec icône et titre */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    application.status === 'Acceptée' ? 'bg-green-100' :
                    application.status === 'En cours' ? 'bg-yellow-100' :
                    application.status === 'Rejetée' ? 'bg-red-100' : 'bg-gray-100'
                  }`}>
                    <Briefcase className={`w-6 h-6 ${
                      application.status === 'Acceptée' ? 'text-green-600' :
                      application.status === 'En cours' ? 'text-yellow-600' :
                      application.status === 'Rejetée' ? 'text-red-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    {/* Afficher tous les postes de la candidature */}
                    {application.positions && application.positions.length > 0 ? (
                      <div className="space-y-2">
                        {application.positions.map((position: Position, index: number) => (
                          <div key={position.id || index} className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{position.title}</h4>
                              {position.company && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Building className="w-4 h-4" />
                                  <span>{position.company}</span>
                                </div>
                              )}
                            </div>
                            {index === 0 && (
                              <Badge className={`${getStatusColor(application.status)} flex items-center gap-2 px-3 py-1.5 text-sm font-medium`}>
                                {getStatusIcon(application.status)}
                                {application.status}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {/* Afficher le nombre de postes si > 1 */}
                        {application.positions.length > 1 && (
                          <div className="mt-2 text-xs text-gray-500 font-medium">
                            {application.positions.length} postes dans cette candidature
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">Poste non spécifié</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="w-4 h-4" />
                          <span>Entreprise</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations temporelles */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(application.appliedDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeSinceApplied(application.appliedDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
