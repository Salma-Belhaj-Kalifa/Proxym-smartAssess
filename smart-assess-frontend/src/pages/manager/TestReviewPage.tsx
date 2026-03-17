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
  ExternalLink
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
  testId: number;
  token: string;
  candidatureId: number;
  candidateName: string;
  positionTitle: string;
  questions: Question[];
  isDraft?: boolean;
}

const TestReviewPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [testLink, setTestLink] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  useEffect(() => {
    if (testId) {
      loadTestData(parseInt(testId));
    }
  }, [testId]);

  const loadTestData = async (id: number) => {
    try {
      setIsLoading(true);
      // Récupérer les données du test généré avec apiClient
      const response = await apiClient.get(`/tests/${id}/review`);
      const data = response.data;
      
      // Vérifier si la réponse contient une erreur
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Si le test est en DRAFT, récupérer les questions depuis le localStorage
      if (data.isDraft || data.questions.length === 0) {
        console.log('Test is DRAFT or has no questions, checking localStorage...');
        const storedQuestions = localStorage.getItem(`test_questions_${id}`);
        console.log('LocalStorage key:', `test_questions_${id}`);
        console.log('Stored questions found:', !!storedQuestions);
        
        if (storedQuestions) {
          try {
            data.questions = JSON.parse(storedQuestions);
            console.log('Loaded questions from localStorage:', data.questions);
            console.log('Number of questions loaded:', data.questions.length);
          } catch (parseError) {
            console.error('Error parsing stored questions:', parseError);
            data.questions = [];
          }
        } else {
          console.warn('No questions found in localStorage for test ID:', id);
          console.log('Available localStorage keys:', Object.keys(localStorage));
          data.questions = [];
        }
      } else {
        console.log('Test is not DRAFT, using questions from backend:', data.questions.length);
      }
      
      setTestData(data);
      console.log('Test data loaded:', data);
    } catch (error: any) {
      console.error('Error loading test data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors du chargement des données du test: ${errorMessage}`);
      navigate('/manager/candidats');
    } finally {
      setIsLoading(false);
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
    
    try {
      setIsSaving(true);
      
      // Si le test est en DRAFT, sauvegarder uniquement dans le localStorage
      if (testData.isDraft) {
        localStorage.setItem(`test_questions_${testData.testId}`, JSON.stringify(testData.questions));
        console.log('Questions saved to localStorage:', testData.questions);
        toast.success('Questions sauvegardées localement');
      } else {
        // Si le test n'est plus en DRAFT, sauvegarder en base
        const response = await apiClient.put(`/tests/${testData.testId}/questions`, {
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
    
    try {
      setIsGeneratingLink(true);
      
      // Si le test est en DRAFT, sauvegarder les questions en base pour la première fois
      if (testData.isDraft) {
        const response = await apiClient.put(`/tests/${testData.testId}/questions`, {
          questions: testData.questions
        });
        
        // Nettoyer le localStorage après la sauvegarde en base
        localStorage.removeItem(`test_questions_${testData.testId}`);
        console.log('Questions saved to database and localStorage cleared');
        
        toast.success('Questions sauvegardées en base avec succès');
      } else {
        // Si le test n'est plus en DRAFT, utiliser la sauvegarde normale
        await saveQuestions();
      }
      
      // Générer le lien du test
      const response = await apiClient.post(`/tests/${testData.testId}/generate-link`);
      const data = response.data;
      
      const link = `${window.location.origin}/candidate/test/${testData.token}`;
      
      setTestLink(link);
      setShowLinkModal(true);
      
      toast.success('Lien du test généré avec succès');
    } catch (error: any) {
      console.error('Error generating test link:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la génération du lien du test: ${errorMessage}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(testLink);
    toast.success('Lien copié dans le presse-papiers');
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
                          {question.options.map((option, optionIndex) => (
                            <option key={optionIndex} value={option}>
                              Option {optionIndex + 1}: {option || '(vide)'}
                            </option>
                          ))}
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
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded border ${
                              option === question.correctAnswer
                                ? 'bg-green-50 border-green-300'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                            {option === question.correctAnswer && (
                              <Badge className="ml-2" variant="default">Correcte</Badge>
                            )}
                          </div>
                        ))}
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
              
              <div className="flex gap-2 pt-4">
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TestReviewPage;
