import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Plus, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Copy,
  ExternalLink,
  Mail
} from 'lucide-react';

interface Question {
  id?: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  skillTag: string;
  maxScore: number;
  orderIndex: number;
}

interface TestReviewData {
  id: number;
  testId?: number;
  token: string;
  status: string;
  createdAt: string;
  deadline: string;
  timeLimitMinutes: number;
  questions: Question[];
  internshipPosition: {
    id: number;
    title: string;
  };
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  isDraft?: boolean;
}

const TestReviewPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testLink, setTestLink] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  useEffect(() => {
    console.log('TestReviewPage - Component mounted with testId:', testId);
    if (testId) {
      console.log('TestReviewPage - Loading test data for ID:', testId);
      loadTestData(parseInt(testId));
    } else {
      console.error('TestReviewPage - No testId provided in URL params');
      toast.error('ID de test manquant dans l\'URL');
    }
  }, [testId]);

  const loadTestData = async (id: number) => {
    try {
      setIsLoading(true);
      console.log('TestReviewPage - Loading test data from API for ID:', id);
      
      // Récupérer les données du test généré avec apiClient
      const response = await apiClient.get(`/tests/${id}/review`);
      const data = response.data;
      
      console.log('TestReviewPage - API response received:', data);
      
      // Essayer de récupérer les questions depuis le localStorage d'abord
      const localStorageQuestions = localStorage.getItem(`test_questions_${id}`);
      console.log('TestReviewPage - Questions from localStorage:', localStorageQuestions ? 'Found' : 'Not found');
      
      if (localStorageQuestions) {
        try {
          const parsedQuestions = JSON.parse(localStorageQuestions);
          console.log('TestReviewPage - Parsed questions from localStorage:', parsedQuestions);
          console.log('Number of questions loaded:', parsedQuestions.length);
          setTestData({
            ...data,
            questions: parsedQuestions
          });
        } catch (parseError) {
          console.error('Error parsing stored questions:', parseError);
          data.questions = [];
          setTestData(data);
        }
      } else {
        console.warn('No questions found in localStorage for test ID:', id);
        console.log('Available localStorage keys:', Object.keys(localStorage));
        data.questions = [];
        setTestData(data);
      }
      
      setIsLoading(false);
      console.log('TestReviewPage - Test data loaded successfully');
      
    } catch (error: any) {
      console.error('TestReviewPage - Error loading test data:', error);
      console.error('TestReviewPage - Error response:', error.response?.data);
      console.error('TestReviewPage - Error status:', error.response?.status);
      
      setIsLoading(false);
      toast.error('Erreur lors du chargement des données du test');
    }
  };

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
    
    console.log('SaveQuestions - testData structure:', testData);
    console.log('SaveQuestions - testData.id:', testData.id);
    
    try {
      setIsSaving(true);
      
      // Déterminer si le test est en DRAFT basé sur le status
      const isDraft = testData.status === 'DRAFT';
      console.log('SaveQuestions - Test is DRAFT:', isDraft);
      
      // Si le test est en DRAFT, sauvegarder uniquement dans le localStorage
      if (isDraft) {
        console.log('SaveQuestions - Using testId:', testData.id);
        localStorage.setItem(`test_questions_${testData.id}`, JSON.stringify(testData.questions));
        console.log('Questions saved to localStorage:', testData.questions);
        toast.success('Questions sauvegardées localement');
      } else {
        // Si le test n'est plus en DRAFT, sauvegarder en base
        console.log('SaveQuestions - Using testId for API:', testData.id);
        const response = await apiClient.put(`/tests/${testData.id}/questions`, {
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
    
    console.log('GenerateTestLink - testData structure:', testData);
    console.log('GenerateTestLink - testData.id:', testData.id);
    
    try {
      setIsGeneratingLink(true);
      
      // Déterminer si le test est en DRAFT basé sur le status
      const isDraft = testData.status === 'DRAFT';
      console.log('GenerateTestLink - Test is DRAFT:', isDraft);
      
      // Si le test est en DRAFT, sauvegarder les questions en base pour la première fois
      if (isDraft) {
        console.log('GenerateTestLink - Using testId for API:', testData.id);
        const response = await apiClient.put(`/tests/${testData.id}/questions`, {
          questions: testData.questions
        });
        
        // Nettoyer le localStorage après la sauvegarde en base
        localStorage.removeItem(`test_questions_${testData.id}`);
        console.log('Questions saved to database and localStorage cleared');
        
        toast.success('Questions sauvegardées en base avec succès');
      } else {
        // Si le test n'est plus en DRAFT, utiliser la sauvegarde normale
        await saveQuestions();
      }
      
      // Informer l'utilisateur que la génération peut prendre du temps
      toast.info('Génération du lien du test en cours... Cette opération peut prendre quelques secondes.');
      
      // Générer le lien du test
      console.log('GenerateTestLink - Using testId for generate-link API:', testData.id);
      const response = await apiClient.post(`/tests/${testData.id}/generate-link`, {}, {
        timeout: 30000 // 30 secondes au lieu de 10 secondes
      });
      const data = response.data;
      
      const link = `${window.location.origin}/candidate/test/${testData.token}`;
      
      setTestLink(link);
      setShowLinkModal(true);
      
      toast.success('Lien du test généré avec succès');
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
      
      // Importer le service d'email
      const { testService } = await import('@/services/apiService');
      
      toast.info('Envoi de l\'email en cours...');
      
      const emailData = {
        recipientEmail: testData.candidate?.email,
        customMessage: `Bonjour ${testData.candidate?.firstName} ${testData.candidate?.lastName},\n\nVous êtes invité à passer un test technique pour le poste de ${testData.internshipPosition?.title}.\n\nVoici votre lien personnel : ${testLink}\n\nCordialement,\nL'équipe de recrutement`
      };
      
      const response = await testService.sendTestEmail(testData.id, emailData);
      
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
    window.open(`/manager/test-preview/${testData.testId}`, '_blank');
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
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
            <h1 className="text-2xl font-bold">Révision du Test</h1>
            <p className="text-gray-600">
              {testData.candidateName} - {testData.positionTitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={previewTest}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </Button>
          
          <Button
            onClick={saveQuestions}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
          
          <Button
            onClick={generateTestLink}
            disabled={isGeneratingLink || testData.questions.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            {isGeneratingLink ? 'Génération...' : 'Valider et générer le lien'}
          </Button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {testData.questions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune question générée</p>
              <p className="text-sm text-gray-500 mt-2">
                Le test a été créé mais aucune question n'a été générée par l'IA.
              </p>
            </CardContent>
          </Card>
        ) : (
          testData.questions.map((question, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <Badge variant="outline">Question {index + 1}</Badge>
                    <Badge variant="secondary">{question.skillTag}</Badge>
                    <Badge variant="outline">{question.maxScore} points</Badge>
                  </CardTitle>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingQuestion(editingQuestion === index ? null : index)}
                    >
                      {editingQuestion === index ? 'Fermer' : 'Modifier'}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteQuestion(index)}
                      className="flex items-center gap-1"
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
                      <label className="block text-sm font-medium mb-2">Question</label>
                      <Textarea
                        value={question.questionText}
                        onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                        className="w-full"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Options de réponse</label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="flex-1"
                            />
                            
                            {option === question.correctAnswer && (
                              <Badge variant="default">Correcte</Badge>
                            )}
                            
                            {question.options.length > 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(index, optionIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          onClick={() => addOption(index)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter une option
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Réponse correcte</label>
                        <select
                          value={question.correctAnswer}
                          onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          {question.options.map((option, optionIndex) => {
                            // Vérifier si l'option contient déjà un préfixe
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
                        <label className="block text-sm font-medium mb-2">Compétence</label>
                        <Input
                          value={question.skillTag}
                          onChange={(e) => updateQuestion(index, 'skillTag', e.target.value)}
                          placeholder="ex: React, Node.js, etc."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Mode lecture
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Question:</h3>
                      <p className="text-gray-700">{question.questionText}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Options de réponse:</h3>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => {
                          // Vérifier si l'option contient déjà un préfixe (A), B), C), etc. ou A., B., C., etc.
                          const hasPrefix = /^[A-D]\)|^[A-D]\./.test(option.trim());
                          const prefix = hasPrefix ? '' : `${String.fromCharCode(65 + optionIndex)}.`;
                          
                          return (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded border ${
                                option === question.correctAnswer
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-medium">{prefix}</span> {option}
                              {option === question.correctAnswer && (
                                <Badge className="ml-2" variant="default">Correcte</Badge>
                              )}
                            </div>
                          );
                        })}
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
                    onClick={() => setShowLinkModal(false)}
                    className="flex-1"
                  >
                    Fermer
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
  );
};

export default TestReviewPage;
