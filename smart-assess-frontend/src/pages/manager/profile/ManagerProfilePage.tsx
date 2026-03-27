import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Briefcase, FileText, Settings, Save, Edit3, Trash2, Mail, Phone, Building, Calendar, AlertTriangle, Shield, MapPin, MoreVertical, Camera, Award, ChevronRight, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/features/auth/authQueries';
import { useManagerProfile } from '@/features/managers/managersQueries';
import { useUpdateManager, useUpdateManagerProfile, useDeleteManagerProfile } from '@/features/managers/managersMutations';
import { removeAuthToken, removeAuthUserData } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ManagerProfilePage() {
  const { data: user, isLoading, error } = useCurrentUser();
  const { data: managerProfile, isLoading: isLoadingProfile } = useManagerProfile(user?.id || 0);
  const queryClient = useQueryClient();
  
  // State variables
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Mutations
  const updateProfileMutation = useUpdateManagerProfile();
  const deleteProfileMutation = useDeleteManagerProfile();
  
  // Utiliser les données du manager (qui contient le department) ou fallback vers user
  const profileData = managerProfile || user;
  
  const [tempFormData, setTempFormData] = useState({
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    email: profileData?.email || '',
    phone: profileData?.phone || '',
    department: profileData?.department || '',
  });

  // Synchroniser tempFormData quand les données du profil changent
  useEffect(() => {
    if (profileData?.firstName || profileData?.lastName || profileData?.email) {
      setTempFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        department: profileData.department || '',
      });
    }
  }, [profileData]);

  const handleCancel = () => {
    // Remettre les données originales du profil
    if (profileData) {
      setTempFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        department: profileData.department || '',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      if (user?.id) {
        await updateProfileMutation.mutateAsync({ 
          userId: user.id, 
          profileData: tempFormData
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Appeler l'API de suppression du profil manager via React Query
      await deleteProfileMutation.mutateAsync();
      
      // Nettoyage manuel pour éviter les redirections automatiques
      removeAuthToken();
      removeAuthUserData();
      queryClient.clear();
      
      // Redirection directe vers la page de connexion manager
      window.location.href = '/recruteur/connexion';
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      // Afficher un message d'erreur à l'utilisateur
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
              <p>Erreur lors du chargement du profil</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header avec avatar et actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {tempFormData.firstName ? tempFormData.firstName.charAt(0).toUpperCase() : 'M'}
                {tempFormData.lastName ? tempFormData.lastName.charAt(0).toUpperCase() : ''}
              </div>
            </div>
            
            {/* Infos principales */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                {tempFormData.firstName} {tempFormData.lastName}
              </h1>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">{tempFormData.email}</span>
                </div>
                {(tempFormData.phone) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{tempFormData.phone}</span>
                  </div>
                )}
                {(tempFormData.department) && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">{tempFormData.department}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Manager</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link to="/manager/dashboard">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-6 shadow-lg">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Tableau de bord
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Carte principale - Informations personnelles */}
        <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                Informations personnelles
              </CardTitle>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 w-10 h-10 p-0 shadow-md"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancel}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 w-10 h-10 p-0"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white border-0 w-10 h-10 p-0 shadow-md"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteModal(true)}
                      className="border-red-300 text-red-600 hover:bg-red-50 w-10 h-10 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Informations de base */}
              <div className="space-y-6">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium mb-2">Prénom</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={tempFormData.firstName}
                      onChange={(e) => setTempFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{tempFormData.firstName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium mb-2">Nom</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={tempFormData.lastName}
                      onChange={(e) => setTempFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{tempFormData.lastName}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium mb-2">Email</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-900">{tempFormData.email}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-700 font-medium mb-2">Téléphone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={tempFormData.phone}
                      onChange={(e) => setTempFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full"
                      placeholder="Numéro de téléphone"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{tempFormData.phone || 'Non spécifié'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="department" className="text-gray-700 font-medium mb-2">Département</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={tempFormData.department}
                      onChange={(e) => setTempFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{tempFormData.department || 'Non spécifié'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 max-w-90vw">
              <CardHeader>
                <CardTitle className="text-red-600">Confirmer la suppression</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
