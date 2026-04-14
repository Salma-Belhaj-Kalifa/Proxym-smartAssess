import { Link } from 'react-router-dom';
import { Calendar, FileText, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

interface RecentApplicationsProps {
  applications: Application[];
  totalApplications: number;
  getStatusColor: (status: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatDate: (dateString: string) => string;
  getTimeSinceApplied: (appliedDate: string) => string;
}

export default function RecentApplications({ 
  applications, 
  totalApplications, 
  getStatusColor, 
  getStatusIcon, 
  formatDate, 
  getTimeSinceApplied 
}: RecentApplicationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Candidatures récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map((application) => (
              <ApplicationStatusCard
                key={application.id}
                application={application}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                formatDate={formatDate}
                getTimeSinceApplied={getTimeSinceApplied}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Vous n'avez pas encore postulé à des offres. Commencez à explorer les opportunités disponibles !
            </p>
            <Link to="/candidat/postes">
              <Button className="flex items-center gap-2 mx-auto">
                <Briefcase className="w-4 h-4" />
                Explorer les offres
              </Button>
            </Link>
          </div>
        )}
        
        {applications.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Link to="/candidat/candidatures">
              <Button variant="outline" className="flex items-center gap-2 mx-auto w-full max-w-xs">
                <FileText className="w-4 h-4" />
                Voir toutes les candidatures
                <span className="ml-auto bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {totalApplications}
                </span>
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import ApplicationStatusCard from './ApplicationStatusCard';
