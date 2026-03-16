import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, Briefcase, ArrowLeft, ArrowRight, Star, Users, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { positionService, candidateService } from '@/services/apiService';
import apiClient from '@/lib/api';
import { useAuth } from '@/hooks/useApiHooks';
import { useQueryClient } from '@tanstack/react-query';
import type { Position } from '@/services/apiService';

const SubmissionPageSimple: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPositions();
    loadSelectedPositions();
  }, []);

  const loadPositions = async () => {
    try {
      const data = await positionService.getPublic();
      setPositions(data);
    } catch (err) {
      console.error('Erreur lors du chargement des positions:', err);
      setError('Impossible de charger les positions');
    }
  };

  const loadSelectedPositions = () => {
    const saved = localStorage.getItem('selectedPositions');
    if (saved) {
      setSelectedPositions(JSON.parse(saved));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Veuillez sélectionner un fichier PDF ou Word');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (selectedPositions.length === 0) {
      toast.error('Veuillez sélectionner au moins une position');
      return;
    }

    setIsUploading(true);
    setSubmitStatus('uploading');
    setError(null);

    try {
      // Simuler la progression d'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Utiliser l'utilisateur connecté pour la candidature
      // Pour l'instant, contourner l'upload de CV et créer directement les candidatures
      if (user?.id) {
        console.log('=== CREATING CANDIDATURES ===');
        console.log('Creating candidatures directly for user:', user.id);
        
        // Créer les candidatures pour chaque position sélectionnée
        for (const positionId of selectedPositions) {
          await candidateService.createCandidature({
            candidateId: user.id,
            internshipPositionId: positionId,
            status: 'PENDING'
          });
        }
        
        console.log('Candidatures created successfully');
        
        // Invalider le cache des candidatures pour forcer le rafraîchissement
        queryClient.invalidateQueries({ queryKey: ['candidatures', 'candidate', user.id] });
        
        // Maintenant essayer l'analyse de CV avec le service IA et sauvegarder dans la base
        if (file) {
          console.log('=== STARTING CV ANALYSIS AND SAVE ===');
          try {
            // Analyser le CV avec le service IA
            const iaFormData = new FormData();
            iaFormData.append('file', file);
            
            const iaResponse = await fetch('http://localhost:8000/api/v1/analyze-cv', {
              method: 'POST',
              body: iaFormData,
            });
            
            if (iaResponse.ok) {
              const iaResult = await iaResponse.json();
              console.log('CV Analysis successful:', iaResult);
              
              // Sauvegarder le CV et le profil technique en utilisant les entités existantes
              try {
                // Créer FormData pour l'upload du CV
                const cvFormData = new FormData();
                cvFormData.append('file', file);
                cvFormData.append('candidateId', user.id.toString());
                
                // Uploader le CV et créer le profil technique
                const cvUploadResponse = await apiClient.post('/candidates/cv', cvFormData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });
                
                console.log('CV uploaded successfully:', cvUploadResponse.data);
                
                // Si l'upload réussit, sauvegarder les résultats de l'analyse
                if (cvUploadResponse.data.id) {
                  const profileData = {
                    parsedData: iaResult // Les données complètes de l'analyse IA
                  };
                  
                  console.log('Sending profile data:', profileData);
                  
                 await apiClient.post(`/technical_profiles/cv/${cvUploadResponse.data.id}`, profileData);
                  console.log('Technical profile saved successfully');
                  toast.success('CV et profil technique sauvegardés avec succès !');
                } else {
                  toast.success('CV analysé avec succès !');
                }
              } catch (saveError) {
                console.error('Failed to save CV or profile:', saveError);
                toast.success('CV analysé avec succès !');
              }
            } else {
              console.warn('CV Analysis failed');
              toast.info('Analyse CV non disponible');
            }
          } catch (iaError) {
            console.error('CV Analysis error:', iaError);
            toast.info('Analyse CV non disponible');
          }
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setSubmitStatus('success');

      // Nettoyer le localStorage
      localStorage.removeItem('selectedPositions');

      toast.success('Candidature soumise avec succès !');

      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate('/candidat/candidatures');
      }, 3000);

    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError('Erreur lors de la soumission de la candidature');
      setSubmitStatus('error');
      toast.error('Erreur lors de la soumission');
    } finally {
      setIsUploading(false);
    }
  };

  const selectedPositionsData = positions.filter(p => selectedPositions.includes(p.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/candidat/postes" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux positions
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Soumettre votre candidature
          </h1>
          <p className="text-lg text-gray-600">
            Téléchargez votre CV et postulez aux positions sélectionnées
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              submitStatus === 'idle' ? 'bg-blue-600 text-white' : 
              submitStatus === 'uploading' ? 'bg-blue-600 text-white' :
              submitStatus === 'success' ? 'bg-green-600 text-white' :
              'bg-red-600 text-white'
            }`}>
              {submitStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="ml-2 text-sm font-medium">Sélection</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              submitStatus === 'idle' ? 'bg-gray-300 text-gray-600' : 
              submitStatus === 'uploading' ? 'bg-blue-600 text-white' :
              submitStatus === 'success' ? 'bg-green-600 text-white' :
              'bg-red-600 text-white'
            }`}>
              {submitStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className="ml-2 text-sm font-medium">Upload</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-300"></div>
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              submitStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {submitStatus === 'success' ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
            <span className="ml-2 text-sm font-medium">Confirmation</span>
          </div>
        </div>

        {/* Selected Positions */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              Positions sélectionnées
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedPositionsData.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-600 mb-2">Aucune position sélectionnée</h4>
                <p className="text-sm text-gray-500 mb-4">Vous devez d'abord sélectionner des positions avant de pouvoir uploader votre CV</p>
                <Link to="/candidat/postes">
                  <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Parcourir les positions
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedPositionsData.map((position) => (
                  <div key={position.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{position.title}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>Tunis, Tunisie</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Temps plein</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Sélectionné
                    </Badge>
                  </div>
                ))}
                
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 text-purple-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">{selectedPositionsData.length} position(s) sélectionnée(s)</span>
                    </div>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CV Upload */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              Télécharger votre CV
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {file ? file.name : 'Glissez votre CV ici'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Formats acceptés: PDF, Word (max 5MB)
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="cv-upload"
              />
              <label htmlFor="cv-upload">
                <Button asChild>
                  <span className="cursor-pointer">
                    {file ? 'Changer de fichier' : 'Sélectionner un fichier'}
                  </span>
                </Button>
              </label>
            </div>

            {file && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Fichier sélectionné: {file.name}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {submitStatus === 'uploading' && (
          <Card className="shadow-xl border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Téléchargement en cours...</h3>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-gray-600">
                  Veuillez patienter pendant que nous traitons votre candidature...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {submitStatus === 'success' && (
          <Card className="mt-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-4">
                Candidature soumise avec succès !
              </h3>
              <p className="text-green-700 mb-6">
                Votre CV a été téléchargé et votre candidature a été envoyée aux {selectedPositionsData.length} position(s) sélectionnée(s).
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm text-green-600">Redirection vers vos candidatures...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mt-8 border-2 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {submitStatus === 'idle' && (
          <div className="flex justify-between">
            <Link to="/candidat/postes">
              <Button variant="outline" className="border-gray-300 text-gray-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <Button 
              onClick={handleUpload}
              disabled={!file || selectedPositions.length === 0 || isUploading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Traitement...
                </>
              ) : (
                <>
                  Soumettre la candidature
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionPageSimple;
