import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Users, Briefcase, Calendar, MoreVertical, Eye, X, CheckCircle, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { usePositions, useCandidatures, useCreatePosition, useUpdatePosition, useDeletePosition, useTogglePositionStatus } from '@/features';
import { PositionStatusBadge } from '@/components/PositionStatusBadge';
import { useQueryClient } from '@tanstack/react-query';

const ManagerPositionsPage: React.FC = () => {
  const { data: positions = [], isLoading, error, refetch } = usePositions();
  const { data: candidatures = [] } = useCandidatures();
  const createPositionMutation = useCreatePosition();
  const updatePositionMutation = useUpdatePosition();
  const deletePositionMutation = useDeletePosition();
  const togglePositionStatusMutation = useTogglePositionStatus();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    requiredSkills: '',
    acceptedDomains: ''
  });

  // Obtenir le nombre de candidats pour une position
  const getApplicantsCount = (positionId: number) => {
    return candidatures.filter(candidature => 
      candidature.positionId === positionId
    ).length;
  };

  // Filtrer les positions
  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = position.isActive !== false;
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && isActive) ||
                         (filterStatus === 'inactive' && !isActive);
    return matchesSearch && matchesFilter;
  });


  // Créer une position
  const handleCreatePosition = async () => {
    try {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error('Le titre et la description sont requis');
        return;
      }

      const requiredSkills = formData.requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const acceptedDomains = formData.acceptedDomains
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

      const newPosition = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: "Proxym IT", // Forcer l'entreprise à Proxym IT
        requiredSkills,
        acceptedDomains,
        isActive: true
      };

      await createPositionMutation.mutateAsync(newPosition);
      
      setFormData({
        title: '',
        description: '',
        company: '',
        requiredSkills: '',
        acceptedDomains: ''
      });
      setIsCreateDialogOpen(false);
      
      toast.success('Position créée avec succès');
    } catch (error: any) {
      console.error('Error creating position:', error);
      toast.error('Erreur lors de la création de la position');
    }
  };

  // Mettre à jour une position
  const handleUpdatePosition = async () => {
    try {
      if (!editingPosition || !formData.title.trim() || !formData.description.trim()) {
        toast.error('Le titre et la description sont requis');
        return;
      }

      const requiredSkills = formData.requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const acceptedDomains = formData.acceptedDomains
        .split(',')
        .map(domain => domain.trim())
        .filter(domain => domain.length > 0);

      const updatedPosition = {
        ...editingPosition,
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: "Proxym IT",
        requiredSkills,
        acceptedDomains
      };

      await updatePositionMutation.mutateAsync({ 
        id: editingPosition.id, 
        data: {
          title: updatedPosition.title,
          description: updatedPosition.description,
          company: updatedPosition.company,
          requiredSkills: updatedPosition.requiredSkills,
          acceptedDomains: updatedPosition.acceptedDomains,
          isActive: editingPosition.isActive // Garder le même statut
        }
      });
      
      setFormData({
        title: '',
        description: '',
        company: '',
        requiredSkills: '',
        acceptedDomains: ''
      });
      setEditingPosition(null);
      setIsCreateDialogOpen(false);
      
      toast.success('Position mise à jour avec succès');
    } catch (error: any) {
      console.error('Error updating position:', error);
      toast.error('Erreur lors de la mise à jour de la position');
    }
  };

  // Supprimer une position
  const handleDeletePosition = async (positionId: number) => {
    try {
      const applicantCount = getApplicantsCount(positionId);
      
      if (applicantCount > 0) {
        // Confirmer la suppression avec les candidatures
        const confirmed = window.confirm(
          `ATTENTION : ${applicantCount} candidat(s) ont postulé à ce poste.\n\n` +
          `Voulez-vous vraiment supprimer ce poste ET toutes les candidatures associées ?\n\n` +
          `Cette action est irréversible !`
        );
        
        if (!confirmed) {
          return;
        }
      }

      await deletePositionMutation.mutateAsync(positionId);
      toast.success('Position et candidatures associées supprimées avec succès');
    } catch (error: any) {
      console.error('Error deleting position:', error);
      toast.error('Erreur lors de la suppression de la position');
    }
  };

  const handleToggleStatus = async (position: any) => {
    const currentIsActive = position.isActive === true;
    const newIsActive = !currentIsActive;
    
    try {
      const loadingToast = toast.loading(`Changement du statut en cours...`, {
        description: `${newIsActive ? 'Activation' : 'Désactivation'} de la position "${position.title}"`
      });
      queryClient.setQueryData(['positions'], (oldData: any) => {
        if (!oldData) return oldData;
        const updated = oldData.map((p: any) => 
          p.id === position.id ? { ...p, isActive: newIsActive } : p
        );
        return updated;
      });

      const result = await togglePositionStatusMutation.mutateAsync(position.id);
            
      queryClient.setQueryData(['positions'], (oldData: any) => {
        if (!oldData) return oldData;
        const updated = oldData.map((p: any) => 
          p.id === position.id ? result : p
        );
        const afterServer = updated.find((p: any) => p.id === position.id);
        console.log('After server update:', { id: afterServer?.id, isActive: afterServer?.isActive });
        return updated;
      });
      
      toast.dismiss(loadingToast);
      toast.success(`Position ${newIsActive ? 'activée' : 'désactivée'} avec succès`, {
        description: `La position "${position.title}" est maintenant ${newIsActive ? 'active' : 'inactive'}`
      });
      
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.refetchQueries({ queryKey: ['positions'] });
      
      setTimeout(() => {
        const currentData = queryClient.getQueryData(['positions']);
        console.log('=== DATA AFTER REFETCH ===');
        console.log('Current positions count:', (currentData as any[])?.length);
        const updatedPosition = (currentData as any[])?.find((p: any) => p.id === position.id);
        console.log('Updated position after refetch:', { 
          id: updatedPosition?.id, 
          isActive: updatedPosition?.isActive,
          title: updatedPosition?.title 
        });
        
        // Vérifier toutes les positions pour voir s'il y a un problème général
        (currentData as any[])?.forEach((p: any) => {
          console.log(`Position ${p.id} (${p.title}): isActive = ${p.isActive}`);
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('Error toggling position status:', error);
      
      // Restaurer l'état précédent en cas d'erreur
      queryClient.setQueryData(['positions'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((p: any) => 
          p.id === position.id ? { ...p, isActive: currentIsActive } : p
        );
      });
      
      toast.error('Erreur lors de la modification du statut', {
        description: error?.response?.data?.message || error?.message || 'Une erreur est survenue'
      });
    }
  };

  // Activer toutes les positions inactives
  const handleActivateAllPositions = async () => {
    const inactivePositions = positions.filter(position => position.isActive !== true);
    
    if (inactivePositions.length === 0) {
      toast.info('Toutes les positions sont déjà actives');
      return;
    }
    
    try {
      const loadingToast = toast.loading(`Activation de ${inactivePositions.length} position(s)...`, {
        description: 'Veuillez patienter pendant que nous activons toutes les positions'
      });
      
      // Activer toutes les positions inactives
      await Promise.all(
        inactivePositions.map(position =>
          togglePositionStatusMutation.mutateAsync(position.id)
        )
      );
      
      toast.dismiss(loadingToast);
      toast.success(`${inactivePositions.length} position(s) activée(s) avec succès`, {
        description: 'Toutes les positions sont maintenant actives et visibles pour les candidats'
      });
      
      // Forcer la mise à jour du cache
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.refetchQueries({ queryKey: ['positions'] });
      
    } catch (error: any) {
      console.error('Error activating all positions:', error);
      
      toast.error('Erreur lors de l\'activation des positions', {
        description: error?.response?.data?.message || error?.message || 'Une erreur est survenue'
      });
    }
  };

  // Ouvrir le dialogue de modification
  const openEditDialog = (position: any) => {
    setEditingPosition(position);
    setFormData({
      title: position.title || '',
      description: position.description || '',
      company: position.company || '',
      requiredSkills: position.requiredSkills ? position.requiredSkills.join(', ') : '',
      acceptedDomains: position.acceptedDomains ? position.acceptedDomains.join(', ') : ''
    });
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement des positions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Erreur lors du chargement</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des positions</h1>
          <p className="text-gray-600 mt-1">Gérez les postes ouverts et les candidatures</p>
        </div>
        <div className="flex gap-2">
          {positions.filter(p => p.isActive !== true).length > 0 && (
            <Button 
              onClick={handleActivateAllPositions}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Power className="w-4 h-4" />
              Activer toutes ({positions.filter(p => p.isActive !== true).length})
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle position
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPosition ? 'Modifier la position' : 'Créer une nouvelle position'}
                </DialogTitle>
                <DialogDescription>
                  {editingPosition 
                    ? 'Modifiez les informations de la position existante.'
                    : 'Remplissez les informations pour créer une nouvelle position de stage.'
                  }
                </DialogDescription>
              </DialogHeader>
            <div className="space-y-4 p-4">
              <div>
                <Label htmlFor="title">Titre du poste *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Développeur Frontend"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Décrivez le poste, les missions, les responsabilités..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="company">Entreprise</Label>
                <Input
                  id="company"
                  value="Proxym IT"
                  disabled
                  className="bg-gray-50 text-gray-700 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">
                  L'entreprise est définie par défaut sur Proxym IT
                </p>
              </div>
              
              <div>
                <Label htmlFor="requiredSkills">Compétences requises</Label>
                <Input
                  id="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({...formData, requiredSkills: e.target.value})}
                  placeholder="React, TypeScript, Node.js (séparez par des virgules)"
                />
              </div>
              
              <div>
                <Label htmlFor="acceptedDomains">Domaines acceptés</Label>
                <Input
                  id="acceptedDomains"
                  value={formData.acceptedDomains}
                  onChange={(e) => setFormData({...formData, acceptedDomains: e.target.value})}
                  placeholder="informatique, marketing(séparez par des virgules)"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={editingPosition ? handleUpdatePosition : handleCreatePosition}
                  disabled={createPositionMutation.isPending || updatePositionMutation.isPending}
                  className="flex-1"
                >
                  {createPositionMutation.isPending || updatePositionMutation.isPending 
                    ? 'Chargement...' 
                    : (editingPosition ? 'Mettre à jour' : 'Créer')
                  }
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingPosition(null);
                    setFormData({
                      title: '',
                      description: '',
                      company: '',
                      requiredSkills: '',
                      acceptedDomains: ''
                    });
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des positions */}
      <div className="space-y-4">
        {filteredPositions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune position trouvée</h3>
              <p className="text-gray-600">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
                  : 'Commencez par créer votre première position.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPositions.map((position) => (
            <Card key={position.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{position.title}</h3>
                      <PositionStatusBadge position={position} />
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{position.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {position.requiredSkills?.slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {position.requiredSkills?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{position.requiredSkills.length - 3}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {position.company}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {getApplicantsCount(position.id)} candidat(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(position)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(position)}
                          className={position.isActive === true ? 'text-orange-600' : 'text-green-600'}
                        >
                          {position.isActive === true ? (
                            <>
                              <X className="w-4 h-4 mr-2" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activer
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/manager/postes/${position.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir détails
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditDialog(position)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePosition(position.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagerPositionsPage;
