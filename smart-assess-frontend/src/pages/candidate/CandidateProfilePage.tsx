import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Briefcase, FileText, Settings, Save, Edit3, Trash2, Mail, Phone, Building, Calendar, AlertTriangle, Shield, MapPin, MoreVertical, Camera, Award, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth, useProfile, useUpdateProfile } from '@/hooks/useApiHooks';
import { authService, candidateService } from '@/services/apiService';
import { removeAuthToken, removeAuthUserData } from '@/lib/api';
import { useQueryClient } from '@/hooks/useQueryClient';

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProfile(user?.id && user?.id > 0 ? user.id : null);
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Utiliser les données du profil ou fallback vers user
  const profileData = profile || user;
  
  const [tempFormData, setTempFormData] = useState({
    firstName: profileData?.firstName || '',
    lastName: profileData?.lastName || '',
    email: profileData?.email || '',
    phone: profileData?.phone || '',
  });

  // Synchroniser tempFormData quand les données du profil changent
  useEffect(() => {
    if (profileData?.firstName || profileData?.lastName || profileData?.email || profileData?.phone) {
      setTempFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
      });
    }
  }, [profileData?.firstName, profileData?.lastName, profileData?.email, profileData?.phone]);

  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!user) {
      window.location.href = '/candidat/connexion';
    }
  }, [user]);

  const handleCancel = () => {
    // Remettre les données originales du profil
    if (profileData) {
      setTempFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setTempFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      if (user?.id) {
        await updateProfileMutation.mutateAsync({ 
          userId: user.id, 
          ...tempFormData 
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  // États de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement du profil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">
          Erreur lors du chargement du profil
        </div>
      </div>
    );
  }

  const handleDeleteAccount = async () => {
    try {
      await candidateService.deleteMyProfile();
      
      // Nettoyage manuel pour éviter les redirections automatiques
      removeAuthToken();
      removeAuthUserData();
      queryClient.clear();
      
      // Redirection directe vers la page de connexion candidat
      window.location.href = '/candidat/connexion';
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header avec avatar et actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {tempFormData.firstName ? tempFormData.firstName.charAt(0).toUpperCase() : 'U'}
                {tempFormData.lastName ? tempFormData.lastName.charAt(0).toUpperCase() : ''}
              </div>
            </div>
            
            {/* Infos principales */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                {tempFormData.firstName} {tempFormData.lastName}
              </h1>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-600 mb-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">{tempFormData.email}</span>
                </div>
                {tempFormData.phone && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-full">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">{tempFormData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Link to="/candidat/dashboard">
                <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white px-6 shadow-lg">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Tableau de bord
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Carte principale - Informations personnelles */}
        <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
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
                      className="border-purple-300 text-purple-700 hover:bg-purple-50 w-10 h-10 p-0"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white border-0 w-10 h-10 p-0 shadow-md"
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
              <div className="space-y-6">
                <div className="group">
                  <Label htmlFor="firstName" className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    Prénom
                  </Label>
                  <Input
                    id="firstName"
                    value={tempFormData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Votre prénom"
                    className="h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all rounded-lg"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="lastName" className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    value={tempFormData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Votre nom"
                    className="h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all rounded-lg"
                  />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="group">
                  <Label htmlFor="email" className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={tempFormData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="votre.email@exemple.com"
                    className="h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all rounded-lg"
                  />
                </div>
                <div className="group">
                  <Label htmlFor="phone" className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-600" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={tempFormData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+216 XX XXX XXX"
                    className="h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all rounded-lg"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Supprimer le compte</h3>
                  <p className="text-sm text-gray-500">Cette action est irréversible</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront définitivement perdues.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 h-10"
                >
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
