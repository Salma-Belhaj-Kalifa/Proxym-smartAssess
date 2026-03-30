import React, { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MapPin, Building, Calendar, Briefcase, Users, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCandidaturesByPosition, usePositions, useUpdatePosition, useDeletePosition } from '@/features';
import { toast } from 'sonner';

export default function PositionDetailPage() {
  const location = useLocation();
  const { positionId } = useParams<{ positionId: string }>();
  
  // Essayer de récupérer l'ID depuis plusieurs sources
  const getIdFromUrl = () => {
    // 1. Depuis useParams
    if (positionId) {
      const id = parseInt(positionId);
      if (!isNaN(id) && id > 0) {
        console.log('ID from useParams:', id);
        return id;
      }
    }
    
    // 2. Depuis l'URL pathname
    const pathname = location.pathname;
    const match = pathname.match(/\/manager\/postes\/(\d+)/);
    if (match && match[1]) {
      const id = parseInt(match[1]);
      if (!isNaN(id) && id > 0) {
        console.log('ID from pathname:', id);
        return id;
      }
    }
    
    // 3. Depuis window.location
    const windowMatch = window.location.pathname.match(/\/manager\/postes\/(\d+)/);
    if (windowMatch && windowMatch[1]) {
      const id = parseInt(windowMatch[1]);
      if (!isNaN(id) && id > 0) {
        console.log('ID from window.location:', id);
        return id;
      }
    }
    
    console.log('No valid ID found');
    return 0;
  };
  
  const id = getIdFromUrl();
  
  console.log('PositionDetailPage - Final ID:', id);
  console.log('PositionDetailPage - pathname:', location.pathname);
  console.log('PositionDetailPage - positionId from params:', positionId);
  
  // Utiliser les hooks React Query
  const { data: positions = [] } = usePositions();
  const position = positions.find(p => p.id === id);
  const { data: candidatures = [] } = useCandidaturesByPosition(id);
  const updatePositionMutation = useUpdatePosition(); // Sera mis à jour avec le bon ID
  const deletePositionMutation = useDeletePosition();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    company: '',
    requiredSkills: '',
    acceptedDomains: '',
    isActive: true
  });
  
  // Initialiser le formulaire d'édition quand le poste change
  React.useEffect(() => {
    if (position) {
      setEditFormData({
        title: position.title || '',
        description: position.description || '',
        company: position.company || '',
        requiredSkills: Array.isArray(position.requiredSkills) ? position.requiredSkills.join(', ') : (position.requiredSkills || ''),
        acceptedDomains: Array.isArray(position.acceptedDomains) ? position.acceptedDomains.join(', ') : (position.acceptedDomains || ''),
        isActive: position.isActive !== false
      });
    }
  }, [position]);
  
  const navigate = useNavigate();

  const handleEdit = () => {
    if (position) {
      setEditFormData({
        title: position.title,
        description: position.description,
        company: position.company,
        requiredSkills: position.requiredSkills.join(', '),
        acceptedDomains: position.acceptedDomains.join(', '),
        isActive: position.isActive
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSave = async () => {
    if (!position) return;

    try {
      const updatedData = {
        ...editFormData,
        requiredSkills: editFormData.requiredSkills.split(',').map(skill => skill.trim()).filter(skill => skill),
        acceptedDomains: editFormData.acceptedDomains.split(',').map(domain => domain.trim()).filter(domain => domain)
      };

      await updatePositionMutation.mutateAsync({ id: position.id, data: updatedData });
      
      setIsEditDialogOpen(false);
      toast.success('Poste mis à jour avec succès');
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error('Erreur lors de la mise à jour du poste');
    }
  };

  const handleDelete = async () => {
    if (!position) return;

    try {
      await deletePositionMutation.mutateAsync(position.id);
      toast.success('Poste supprimé avec succès');
      navigate('/manager/postes');
    } catch (error: any) {
      console.error('Error deleting position:', error);
      toast.error('Erreur lors de la suppression du poste');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Pas besoin de logique de chargement manuelle - React Query gère cela
  // Si le poste n'est pas trouvé et que nous avons un ID valide, afficher une erreur
  if (id > 0 && !position && positions.length > 0) {
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
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{position.title}</h1>
            <p className="text-gray-500 flex items-center gap-2 mt-1">
              <Building className="w-4 h-4" />
              {position.company}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Position Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Position Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Détails du poste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{position.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Compétences requises</h3>
                <div className="flex flex-wrap gap-2">
                  {position.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Domaines acceptés</h3>
                <div className="flex flex-wrap gap-2">
                  {position.acceptedDomains.map((domain, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Statut du poste</h3>
                  <div className="mt-2">
                    {getStatusBadge(position.isActive)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Créé le</p>
                  <p className="font-medium">{new Date(position.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidates Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Candidatures ({stats.total})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  <div className="text-sm text-gray-500">En attente</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
                  <div className="text-sm text-gray-500">Acceptés</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                  <div className="text-sm text-gray-500">Rejetés</div>
                </div>
              </div>
              
              {candidatures.length > 0 ? (
                <div className="space-y-3">
                  {candidatures.slice(0, 5).map((candidature) => (
                    <div key={candidature.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{candidature.candidateFirstName} {candidature.candidateLastName}</p>
                          <p className="text-sm text-gray-500">{candidature.candidateEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(candidature.status)}>
                          {candidature.status}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // Naviguer vers la page de génération de test avec le candidat
                            const candidatureData = {
                              id: candidature.id,
                              candidateId: candidature.candidateId,
                              positionId: candidature.internshipPositionId || 0,
                              status: candidature.status,
                              appliedAt: candidature.appliedAt,
                              // Ajouter les informations complètes du candidat pour l'affichage
                              candidateFirstName: candidature.candidateFirstName,
                              candidateLastName: candidature.candidateLastName,
                              candidateEmail: candidature.candidateEmail,
                              candidatePhone: candidature.candidatePhone,
                              positionTitle: candidature.positionTitle,
                              positionCompany: candidature.positionCompany,
                              positionDescription: candidature.positionDescription,
                              // Ajouter les données IA si disponibles
                              aiScore: candidature.aiScore,
                              aiAnalysis: candidature.aiAnalysis,
                              parsedData: candidature.parsedData,
                              domain: candidature.domain,
                              technologies: candidature.technologies,
                              experienceYears: candidature.experienceYears,
                              skillLevel: candidature.skillLevel,
                              careerLevel: candidature.careerLevel,
                              certifications: candidature.certifications,
                              projects: candidature.projects,
                              education: candidature.education,
                              workExperience: candidature.workExperience,
                              experience: candidature.experience,
                              technicalProfile: candidature.technicalProfile,
                              candidateCVs: candidature.candidateCVs,
                              technicalProfiles: candidature.technicalProfiles
                            };
                            
                            console.log('PositionDetailPage - Données complètes envoyées:', candidatureData);
                            
                            // Stocker les données complètes du candidat dans sessionStorage pour la page de génération de test
                            sessionStorage.setItem('selectedCandidature', JSON.stringify(candidatureData));
                            
                            // Naviguer vers la page de génération de test
                            navigate(`/manager/candidats/${candidature.candidateId}/generer-test`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir détails
                        </Button>
                      </div>
                    </div>
                  ))}
                  {candidatures.length > 5 && (
                    <div className="text-center mt-4">
                      <Link to={`/manager/candidats?position=${position.id}`}>
                        <Button variant="outline" className="w-full max-w-xs">
                          <Users className="w-4 h-4 mr-2" />
                          Voir toutes les candidatures ({candidatures.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune candidature pour ce poste</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier le poste
              </Button>
              <Button 
                variant="destructive" 
                className="w-full justify-start"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer le poste
              </Button>
            </CardContent>
          </Card>

          {/* Position Status */}
          <Card>
            <CardHeader>
              <CardTitle>Statut du poste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStatusBadge(position.isActive)}
                </div>
                <div className="text-sm text-gray-600">
                  {position.isActive 
                    ? "Ce poste est actif et visible par les candidats"
                    : "Ce poste est inactif et invisible par les candidats"
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le poste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div>
              <Label htmlFor="title">Titre du poste</Label>
              <Input
                id="title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ex: Développeur Frontend"
              />
            </div>

            <div>
              <Label htmlFor="company">Entreprise</Label>
              <Input
                id="company"
                value={editFormData.company}
                onChange={(e) => setEditFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="ex: TechCorp"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Décrivez le poste, les responsabilités, etc."
              />
            </div>

            <div>
              <Label htmlFor="requiredSkills">Compétences requises</Label>
              <Input
                id="requiredSkills"
                value={editFormData.requiredSkills}
                onChange={(e) => setEditFormData(prev => ({ ...prev, requiredSkills: e.target.value }))}
                placeholder="React, TypeScript, Node.js (séparées par des virgules)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Séparez les compétences par des virgules
              </p>
            </div>

            <div>
              <Label htmlFor="acceptedDomains">Domaines email acceptés</Label>
              <Input
                id="acceptedDomains"
                value={editFormData.acceptedDomains}
                onChange={(e) => setEditFormData(prev => ({ ...prev, acceptedDomains: e.target.value }))}
                placeholder="gmail.com, outlook.com, yahoo.com (séparés par des virgules)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Séparez les domaines par des virgules
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Poste actif</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updatePositionMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePositionMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-4">
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Supprimer le poste</h3>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer le poste "<strong>{position.title}</strong>" ?
              </p>
              <p className="text-sm text-red-600 mb-4">
                Cette action est irréversible et affectera toutes les candidatures associées.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deletePositionMutation.isPending}
              >
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deletePositionMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletePositionMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
