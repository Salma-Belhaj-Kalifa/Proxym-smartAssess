import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Mail, Send, CheckCircle, AlertCircle, Clock, Calendar, User, Briefcase, Save, Trash2, Plus, Check, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { useTests, useTestReview } from '@/features/tests/testsQueries';
import { useUpdateTest } from '@/features/tests/testsMutations';
import { TestReviewData, Question } from '@/features/tests/types';

const TestReviewPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestReviewData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testLink, setTestLink] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  
  // Utiliser le hook pour récupérer les données du test
  const { data: reviewData, isLoading, error } = useTestReview(testId ? parseInt(testId) : 0);
  const updateTestMutation = useUpdateTest();

  // Synchroniser les données du hook avec l'état local
  useEffect(() => {
    if (reviewData) {
      console.log('TestReviewPage - Review data from hook:', reviewData);
      console.log('TestReviewData structure:', {
        id: reviewData.id,
        testId: reviewData.testId,
        token: reviewData.token,
        status: reviewData.status
      });
      setTestData(reviewData);
    }
  }, [reviewData]);

  useEffect(() => {
    if (error) {
      console.error('Error loading test data:', error);
      toast.error('Failed to load test data');
    }
  }, [error]);

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    if (!testData) return;
    
    const updatedQuestions = [...testData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    
    setTestData({ ...testData, questions: updatedQuestions });
  };

  const addOption = (questionIndex: number) => {
    if (!testData) return;
    
    const updatedQuestions = [...testData.questions];
    const currentOptions = updatedQuestions[questionIndex].options || [];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...currentOptions, '']
    };
    
    setTestData({ ...testData, questions: updatedQuestions });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!testData) return;
    
    const updatedQuestions = [...testData.questions];
    const currentOptions = [...updatedQuestions[questionIndex].options];
    currentOptions[optionIndex] = value;
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: currentOptions
    };
    
    setTestData({ ...testData, questions: updatedQuestions });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (!testData) return;
    
    const updatedQuestions = [...testData.questions];
    const currentOptions = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: currentOptions
    };
    
    setTestData({ ...testData, questions: updatedQuestions });
  };

  const deleteQuestion = (index: number) => {
    if (!testData) return;
    
    const updatedQuestions = testData.questions.filter((_, i) => i !== index);
    setTestData({ ...testData, questions: updatedQuestions });
    
    toast.success('Question supprimée');
  };

  const saveQuestions = async () => {
    if (!testData) return;
    
    // Ensure we have a valid testId
    const testId = testData.id || testData.testId;
    console.log('SaveQuestions - Using testId:', testId, 'from testData.id:', testData.id, 'from testData.testId:', testData.testId);
    if (!testId || typeof testId !== 'number' || testId <= 0) {
      console.error('SaveQuestions - Invalid testId:', testId);
      toast.error('ID de test invalide');
      return;
    }
    
    console.log('SaveQuestions - testData structure:', testData);
    console.log('SaveQuestions - testData.id:', testId);
    
    try {
      setIsSaving(true);
      
      // Déterminer si le test est en DRAFT basé sur le status
      const isDraft = testData.status === 'DRAFT';
      console.log('SaveQuestions - Test is DRAFT:', isDraft);
      
      // Si le test est en DRAFT, sauvegarder uniquement dans le localStorage
      if (isDraft) {
        console.log('SaveQuestions - Using testId:', testId);
        localStorage.setItem(`test_questions_${testId}`, JSON.stringify(testData.questions));
        console.log('Questions saved to localStorage:', testData.questions);
        toast.success('Questions sauvegardées localement');
      } else {
        // Si le test n'est plus en DRAFT, sauvegarder en base
        console.log('SaveQuestions - Using testId for API:', testId);
        const response = await apiClient.put(`/tests/${testId}/questions`, {
          questions: testData.questions
        });
        
        toast.success('Questions sauvegardées avec succès');
      }
    } catch (error: any) {
      console.error('Error saving questions:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la sauvegarde des questions: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateTestLink = async () => {
    if (!testData) return;
    
    // Ensure we have a valid testId
    const testId = testData.id || testData.testId;
    console.log('GenerateTestLink - Using testId:', testId, 'from testData.id:', testData.id, 'from testData.testId:', testData.testId);
    if (!testId || typeof testId !== 'number' || testId <= 0) {
      console.error('GenerateTestLink - Invalid testId:', testId);
      toast.error('ID de test invalide');
      return;
    }
    
    console.log('GenerateTestLink - testData structure:', testData);
    console.log('GenerateTestLink - testData.id:', testId);
    
    try {
      setIsGeneratingLink(true);
      
      // Déterminer si le test est en DRAFT basé sur le status
      const isDraft = testData.status === 'DRAFT';
      console.log('GenerateTestLink - Test is DRAFT:', isDraft);
      
      // Si le test est en DRAFT, sauvegarder les questions en base pour la première fois
      if (isDraft) {
        console.log('GenerateTestLink - Using testId for API:', testId);
        const response = await apiClient.put(`/tests/${testId}/questions`, {
          questions: testData.questions
        });
        
        // Nettoyer le localStorage après la sauvegarde en base
        localStorage.removeItem(`test_questions_${testId}`);
        console.log('Questions saved to database and localStorage cleared');
        
        toast.success('Questions sauvegardées en base avec succès');
        
        // Mettre à jour le statut de la candidature à TEST_SENT
        try {
          // Récupérer l'ID de la candidature depuis les données du test
          // Le backend inclut maintenant candidatureId dans la réponse
          const candidatureId = (testData as any).candidatureId;
          
          console.log('Updating candidature status - candidatureId:', candidatureId);
          
          if (candidatureId && typeof candidatureId === 'number') {
            console.log(`Updating candidature ${candidatureId} status to TEST_SENT`);
            const response = await apiClient.put(`/candidatures/${candidatureId}/status`, {
              status: 'TEST_SENT'
            });
            console.log('Candidature status updated successfully:', response.data);
          } else {
            console.error('Invalid candidatureId:', candidatureId);
            console.error('Available fields in testData:', Object.keys(testData));
            toast.warning('Le lien a été généré mais le statut de la candidature n\'a pas pu être mis à jour.');
          }
        } catch (error: any) {
          console.error('Error updating candidature status:', error);
          console.error('Error response:', error.response?.data);
          
          // Don't fail the entire process if status update fails
          toast.warning('Le lien a été généré mais la mise à jour du statut a échoué. Le candidat pourra toujours passer le test.');
        }
      } else {
        // Si le test n'est plus en DRAFT, utiliser la sauvegarde normale
        await saveQuestions();
      }
      
      // Informer l'utilisateur que la génération peut prendre du temps
      toast.info('Génération du lien du test en cours... Cette opération peut prendre quelques secondes.');
      
      // Générer le lien du test
      console.log('GenerateTestLink - Using testId for generate-link API:', testId);
      const response = await apiClient.post(`/tests/${testId}/generate-link`, {}, {
        timeout: 30000 // 30 secondes au lieu de 10 secondes
      });
      const data = response.data;
      
      console.log('GenerateTestLink - API response:', data);
      console.log('GenerateTestLink - Full response structure:', JSON.stringify(data, null, 2));
      
      // Use the token from the API response with fallbacks
      let token = data.token || testData.token;
      
      // If still no token, try to get it from the test data again
      if (!token) {
        console.warn('GenerateTestLink - No token in API response, checking testData...');
        token = testData.token;
      }
      
      // Final fallback - generate a temporary token
      if (!token) {
        console.error('GenerateTestLink - No token found anywhere, using fallback');
        token = `temp-${testId}-${Date.now()}`;
      }
      
      const link = `${window.location.origin}/candidate/test/${token}`;
      
      console.log('GenerateTestLink - Final token:', token);
      console.log('GenerateTestLink - Generated link:', link);
      
      setTestLink(link);
      setShowLinkModal(true);
      
      toast.success('Lien du test généré avec succès');
      
      // Rediriger automatiquement vers la page des candidats après 3 secondes
      setTimeout(() => {
        toast.info('Redirection vers la page des candidats...');
        navigate('/manager/candidats');
      }, 3000);
    } catch (error: any) {
      console.error('Error generating test link:', error);
      
      let errorMessage = 'Erreur inconnue';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'La génération du lien prend trop de temps. Veuillez réessayer. Le serveur est peut-être surchargé.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`Erreur lors de la génération du lien: ${errorMessage}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testLink);
    toast.success('Lien copié dans le presse-papiers');
  };

  const sendTestEmail = async () => {
    if (!testData) return;
    
    try {
      setIsSendingEmail(true);
      
      toast.info('Envoi de l\'email en cours...');
      
      const emailData = {
        recipientEmail: testData.candidate?.email,
        customMessage: `Bonjour ${testData.candidate?.firstName} ${testData.candidate?.lastName},\n\nVous êtes invité à passer un test technique pour le poste de ${testData.internshipPosition?.title}.\n\nVoici votre lien personnel : ${testLink}\n\nCordialement,\nL'équipe de recrutement`
      };
      
      // Utiliser apiClient directement car testService.sendTestEmail n'existe pas
      const response = await apiClient.post(`/tests/${testId}/send-email`, emailData);
      
      toast.success('Email envoyé avec succès au candidat !');
      console.log('Email sent successfully:', response);
      
    } catch (error: any) {
      console.error('Error sending email:', error);
      
      let errorMessage = 'Erreur lors de l\'envoi de l\'email';
      
      if (error.response?.status === 500) {
        errorMessage = 'Erreur serveur lors de l\'envoi de l\'email. Veuillez vérifier la configuration du serveur d\'email.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const previewTest = () => {
    if (!testData) return;
    window.open(`/manager/test-preview/${testData.id}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des questions générées...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Test non trouvé</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/manager/candidats')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Révision du Test</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {testData?.candidate?.firstName} {testData?.candidate?.lastName} - {testData?.internshipPosition?.title}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={previewTest}
                  className="flex items-center gap-2"
                  disabled={testData?.questions?.length === 0}
                >
                  <Eye className="w-4 h-4" />
                  Aperçu
                </Button>
                
                <Button
                  onClick={saveQuestions}
                  disabled={isSaving || testData?.questions?.length === 0}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Button>
                
                <Button
                  onClick={generateTestLink}
                  disabled={isGeneratingLink || !testData?.questions || testData.questions.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isGeneratingLink ? 'Génération...' : 'Valider et générer le lien'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques du test */}
        {testData && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <p className="font-semibold text-gray-900">{testData.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Questions</p>
                    <p className="font-semibold text-gray-900">{testData.questions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-purple-600 font-bold">⏱</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Durée</p>
                    <p className="font-semibold text-gray-900">{testData.timeLimitMinutes} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <span className="text-yellow-600 font-bold">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Niveau</p>
                    <p className="font-semibold text-gray-900">{testData.level || 'JUNIOR'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <span className="text-red-600 font-bold">📅</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date limite</p>
                    <p className="font-semibold text-gray-900 text-xs">
                      {testData.deadline ? new Date(testData.deadline).toLocaleDateString('fr-FR') : 'Non définie'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-orange-600 font-bold">👤</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Candidat</p>
                    <p className="font-semibold text-gray-900 text-xs">
                      {testData.candidate?.firstName} {testData.candidate?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{testData.candidate?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Questions */}
        <div className="space-y-6">
          {(!testData.questions || testData.questions.length === 0) ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune question générée</h3>
                  <p className="text-gray-600 mb-4">
                    Le test a été créé mais aucune question n'a été générée par l'IA.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Possible cause:</strong> L'IA n'a pas pu générer les questions automatiquement.
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      <strong>Solution:</strong> Vous pouvez ajouter manuellement les questions ci-dessous ou régénérer le test.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => window.location.reload()} 
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour à la génération
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            testData.questions.map((question, index) => (
              <Card key={index} className="relative hover:shadow-md transition-shadow duration-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Question {index + 1}
                      </Badge>
                      <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                        {question.skillTag || 'Non spécifiée'}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {question.maxScore} points
                      </Badge>
                    </CardTitle>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQuestion(editingQuestion === index ? null : index)}
                        className="hover:bg-blue-50"
                      >
                        {editingQuestion === index ? 'Fermer' : 'Modifier'}
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteQuestion(index)}
                        className="hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {editingQuestion === index ? (
                    // Mode édition
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Question</label>
                        <Textarea
                          value={question.questionText}
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          placeholder="Entrez votre question ici..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Options de réponse</label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className={`flex-1 ${
                                  option === question.correctAnswer 
                                    ? 'border-green-500 bg-green-50 ring-green-500' 
                                    : 'border-gray-300'
                                }`}
                              />
                              
                              {option === question.correctAnswer && (
                                <div className="flex items-center gap-1">
                                  <Badge variant="default" className="bg-green-600 text-white">
                                    <Check className="w-3 h-3" />
                                    Réponse correcte
                                  </Badge>
                                </div>
                              )}
                              
                              {question.options.length > 2 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          
                          <Button
                            variant="outline"
                            onClick={() => addOption(index)}
                            className="flex items-center gap-2 hover:bg-blue-50"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter une option
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Réponse correcte</label>
                          <select
                            value={question.correctAnswer}
                            onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                          >
                            {question.options.map((option, optionIndex) => {
                              const hasPrefix = /^[A-D]\)|^[A-D]\./.test(option.trim());
                              const displayText = hasPrefix ? option : `${String.fromCharCode(65 + optionIndex)}. ${option}`;
                              
                              return (
                                <option key={optionIndex} value={option}>
                                  {displayText || `(Option ${optionIndex + 1} - vide)`}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Compétence</label>
                          <Input
                            value={question.skillTag}
                            onChange={(e) => updateQuestion(index, 'skillTag', e.target.value)}
                            placeholder="ex: React, Node.js, etc."
                            className="border-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Mode lecture
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="font-medium mb-2 text-blue-900">Question:</h3>
                        <p className="text-gray-800 font-medium">
                          {question.questionText || 'Texte de la question non disponible'}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3 text-gray-700">Options de réponse:</h3>
                        <div className="space-y-2">
                          {(() => {
                            if (Array.isArray(question.options)) {
                              return (question.options as string[]).map((option, optionIndex) => {
                                const hasPrefix = /^[A-D]\)|^[A-D]\./.test(option.trim());
                                const cleanOption = option.replace(/^[A-D]\)\s*/, '').trim();
                                const isCorrect = option === question.correctAnswer;
                                
                                console.log(`Option ${optionIndex}: "${option}" vs Correct: "${question.correctAnswer}" = ${isCorrect}`);
                                
                                return (
                                  <div 
                                    key={optionIndex} 
                                    className={`p-4 rounded-lg border transition-all duration-200 ${
                                      isCorrect
                                        ? 'bg-green-50 border-green-300 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                          isCorrect 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-200 text-gray-600'
                                        }`}>
                                          {String.fromCharCode(65 + optionIndex)}
                                        </div>
                                        <span className="font-medium text-gray-900">{cleanOption}</span>
                                      </div>
                                      
                                      {isCorrect && (
                                        <Badge variant="default" className="bg-green-600 text-white px-3 py-1">
                                          <Check className="w-4 h-4" />
                                          Réponse correcte
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              });
                            } else if (question.options && typeof question.options === 'object') {
                              const optionsObj = question.options as any;
                              return Object.keys(optionsObj).map((key, index) => (
                                <div key={index} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                                  <span className="font-medium">{optionsObj[key]}</span>
                                </div>
                              ));
                            } else {
                              return <div className="text-gray-500">Pas d'options disponibles</div>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

      {/* Modal de lien généré */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Lien du test généré
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lien pour le candidat:</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={testLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyToClipboard} size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>• Envoyez ce lien au candidat par email</p>
                <p>• Le candidat pourra passer le test en ligne</p>
                <p>• Les résultats seront disponibles dans votre tableau de bord</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2 pt-4">
                <Button
                  onClick={sendTestEmail}
                  disabled={isSendingEmail || !testData?.candidate?.email}
                  className="w-full flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {isSendingEmail ? 'Envoi en cours...' : 'Envoyer par email'}
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/manager/candidats')}
                    className="flex-1 flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux candidats
                  </Button>
                  
                  <Button
                    onClick={() => window.open(testLink, '_blank')}
                    className="flex-1 flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir le test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default TestReviewPage;
