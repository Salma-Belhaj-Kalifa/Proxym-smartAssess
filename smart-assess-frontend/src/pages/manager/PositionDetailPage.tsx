import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MapPin, Building, Calendar, Briefcase, Users, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { usePositions, useCandidaturesByPosition } from '@/hooks/useApiHooks';
import { toast } from 'sonner';

export default function PositionDetailPage() {
  const { positionId } = useParams<{ positionId: string }>();
  const id = parseInt(positionId || '0');
  
  const { data: positions = [] } = usePositions();
  const position = positions.find(p => p.id === id);
  const { data: candidatures = [] } = useCandidaturesByPosition(id);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (!position) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Poste non trouvé</h2>
          <p className="text-gray-600 mb-4">Le poste que vous recherchez n'existe pas.</p>
          <Link to="/manager/postes">
            <Button>Retour aux postes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <CheckCircle className="w-3 h-3 mr-1" />
        Actif
      </Badge>
    ) : (
      <Badge variant="secondary">
        <XCircle className="w-3 h-3 mr-1" />
        Inactif
      </Badge>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'ACCEPTED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleDeletePosition = async () => {
    try {
      // TODO: Implement delete API call
      toast.success('Poste supprimé avec succès');
      window.location.href = '/manager/postes';
    } catch (error) {
      toast.error('Erreur lors de la suppression du poste');
    }
  };

  const stats = {
    total: candidatures.length,
    pending: candidatures.filter(c => c.status === 'PENDING').length,
    accepted: candidatures.filter(c => c.status === 'ACCEPTED').length,
    rejected: candidatures.filter(c => c.status === 'REJECTED').length,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to="/manager/postes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux postes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{position.title}</h1>
            <p className="text-muted-foreground">
              {position.company} • {getStatusBadge(position.isActive)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le poste</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p className="text-gray-600">Fonctionnalité de modification en cours de développement...</p>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer le poste</DialogTitle>
              </DialogHeader>
              <div className="p-4">
                <p className="text-gray-600 mb-4">
                  Êtes-vous sûr de vouloir supprimer le poste "{position.title}" ? Cette action est irréversible.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePosition}>
                    Supprimer
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total candidatures</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Acceptés</p>
                <p className="text-xl font-bold">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Refusés</p>
                <p className="text-xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Position Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Description du poste
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{position.description}</p>
            </CardContent>
          </Card>

          {/* Skills Required */}
          <Card>
            <CardHeader>
              <CardTitle>Compétences requises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {position.requiredSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Applications */}
          {candidatures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Candidatures récentes
                  </span>
                  <Link to={`/manager/postes/${position.id}/candidatures`}>
                    <Button variant="outline" size="sm">
                      Voir tout
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {candidatures.slice(0, 3).map((candidature) => (
                    <div key={candidature.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {candidature.candidateFirstName || 'Prénom'} {candidature.candidateLastName || 'Nom'}
                          </p>
                          <p className="text-sm text-gray-600">{candidature.candidateEmail || 'email@example.com'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(candidature.status)}>
                          {candidature.status === 'PENDING' ? 'En attente' :
                           candidature.status === 'ACCEPTED' ? 'Accepté' :
                           candidature.status === 'REJECTED' ? 'Refusé' : candidature.status}
                        </Badge>
                        {candidature.aiScore && (
                          <span className="text-sm font-medium">
                            {candidature.aiScore}/10
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Position Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Entreprise</p>
                  <p className="font-medium">{position.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Localisation</p>
                  <p className="font-medium">{position.location || 'Non spécifiée'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Publié le</p>
                  <p className="font-medium">
                    {new Date(position.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              {position.salary && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Salaire</p>
                    <p className="font-medium">{position.salary}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={`/manager/postes/${position.id}/candidatures`}>
                <Button className="w-full" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Voir les candidatures
                </Button>
              </Link>
              <Button className="w-full" variant="outline">
                <Briefcase className="w-4 h-4 mr-2" />
                Dupliquer le poste
              </Button>
              <Button className="w-full" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Planifier un entretien
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
