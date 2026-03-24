import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Send,
  Timer
} from 'lucide-react';
import apiClient from '@/lib/api';
import apiService from '@/services/apiService';

interface Question {
  id: number;
  questionText: string;
  questionType: string;
  options: string[];
  correctAnswer: string;
  skillTag: string;
  maxScore: number;
  orderIndex: number;
}

interface TestData {
  testId: number;
  token: string;
  candidateName: string;
  positionTitle: string;
  duration: number;
  deadline: string;
  questions: Question[];
}

const CandidateTestPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);

  useEffect(() => {
    if (token) {
      loadTestData(token);
    }
  }, [token]);

  useEffect(() => {
    if (testStarted && !testSubmitted && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && testStarted && !testSubmitted) {
      submitTest();
    }
  }, [timeRemaining, testStarted, testSubmitted]);

  const loadTestData = async (testToken: string) => {
    try {
      setIsLoading(true);
      console.log('Loading test data for token:', testToken);
      
      // D'abord récupérer les données du test (questions, durée, etc.)
      const testDataResponse = await apiService.testService.getPublicTest(testToken);
      console.log('=== DONNÉES COMPLÈTES DU TEST ===');
      console.log('Test data response:', JSON.stringify(testDataResponse, null, 2));
      console.log('Test data type:', typeof testDataResponse);
      console.log('Test data keys:', Object.keys(testDataResponse || {}));
      console.log('Questions:', testDataResponse?.questions);
      console.log('Questions type:', typeof testDataResponse?.questions);
      console.log('Questions length:', testDataResponse?.questions?.length);
      console.log('Is array:', Array.isArray(testDataResponse?.questions));
      console.log('=== FIN DONNÉES TEST ===');
      
      // Créer un objet testData compatible avec ce que le frontend attend
      const testData = {
        testId: testDataResponse.testId,
        duration: testDataResponse.duration || 24,
        questions: testDataResponse.questions || [],
        positionTitle: 'Poste technique', // À améliorer si nécessaire
        token: testToken,
        candidateName: 'Candidat', // À améliorer si nécessaire
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h from now
      };
      
      setTestData(testData);
      setTimeRemaining(testData.duration * 60); // Convertir minutes en secondes
      
      // Charger les réponses sauvegardées après avoir reçu les données du test
      setTimeout(() => {
        loadSavedAnswers();
      }, 100);
      
    } catch (error: any) {
      console.error('Error loading test data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors du chargement du test: ${errorMessage}`);
      navigate('/candidate/login');
    } finally {
      setIsLoading(false);
    }
  };

  const startTest = async () => {
    if (!token) {
      toast.error('Token de test invalide');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting test with token:', token);
      
      // Appeler l'endpoint de démarrage du test
      const startResponse = await apiService.testService.startTest(token);
      console.log('Test started successfully:', startResponse);
      
      setTestStarted(true); 
      toast.success('Test démarré avec succès !');
      
    } catch (error: any) {
      console.error('Error starting test:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Erreur lors du démarrage du test';
      
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Test non valide';
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.error || 'Erreur serveur lors du démarrage du test';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    console.log(`=== RÉPONSE MODIFIÉE ===`);
    console.log(`Question ID: ${questionId}`);
    console.log(`Nouvelle réponse: ${answer}`);
    console.log(`Réponses avant:`, answers);
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      console.log(`Réponses après:`, newAnswers);
      console.log(`Total de réponses: ${Object.keys(newAnswers).length}`);
      
      // Auto-save des réponses dans localStorage
      if (testData && token) {
        const saveKey = `test_answers_${testData.testId}_${token}`;
        localStorage.setItem(saveKey, JSON.stringify(newAnswers));
        console.log(`Réponses sauvegardées dans localStorage avec clé: ${saveKey}`);
      }
      
      return newAnswers;
    });
  };
  
  // Charger les réponses sauvegardées au démarrage
  const loadSavedAnswers = () => {
    if (testData && token) {
      const saveKey = `test_answers_${testData.testId}_${token}`;
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        try {
          const parsedAnswers = JSON.parse(saved);
          console.log(`Réponses chargées depuis localStorage:`, parsedAnswers);
          setAnswers(parsedAnswers);
        } catch (error) {
          console.error('Erreur lors du chargement des réponses sauvegardées:', error);
        }
      }
    }
  };
  
  // Nettoyer les réponses sauvegardées après soumission
  const clearSavedAnswers = () => {
    if (testData && token) {
      const saveKey = `test_answers_${testData.testId}_${token}`;
      localStorage.removeItem(saveKey);
      console.log(`Réponses sauvegardées supprimées avec clé: ${saveKey}`);
    }
  };

  const questions = (testData as any)?.questions || (testData as any)?.questionList || (testData as any)?.testQuestions || (testData as any)?.questionsData || [];

  const nextQuestion = () => {
    if (currentQuestionIndex < (questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitTest = async () => {
    if (!testData) return;
    
    try {
      setIsSubmitting(true);
      
      console.log('=== DÉBUT SOUMISSION TEST ===');
      console.log('Test data:', testData);
      console.log('Token:', token);
      console.log('Answers actuels:', answers);
      console.log('Time remaining:', timeRemaining);
      
      // Convertir les réponses en format attendu par le backend
      const formattedAnswers: Record<number, string> = {};
      Object.entries(answers).forEach(([questionId, answer]) => {
        formattedAnswers[parseInt(questionId)] = answer;
      });
      
      console.log('Formatted answers:', formattedAnswers);
      
      const submissionData = {
        testId: testData.testId,
        token: token,  // ✅ Utiliser le token de l'URL
        answers: formattedAnswers,
        timeSpent: (testData.duration * 60) - timeRemaining,
        submittedAt: new Date().toISOString()
      };
      
      console.log('Données de soumission complètes:', JSON.stringify(submissionData, null, 2));
      
      // Utiliser le service API au lieu de apiClient directement
      const response = await apiService.testService.submitTest(testData.testId, submissionData);
      
      console.log('Réponse du backend:', response);
      
      setTestSubmitted(true);
      
      // Nettoyer les réponses sauvegardées après soumission réussie
      clearSavedAnswers();
      
      toast.success('Test soumis avec succès !');
      
      setTimeout(() => {
        navigate('/candidate/test-submitted', { 
          state: { testResult: response.data } 
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('=== ERREUR SOUMISSION TEST ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erreur inconnue lors de la soumission';
      
      toast.error(`Erreur lors de la soumission du test: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!testData) return 0;
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du test...</p>
        </div>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Test non trouvé ou expiré</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  if (testSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Test soumis avec succès !</h2>
            <p className="text-gray-600 mb-4">
              Merci d'avoir complété le test. Vos réponses ont été enregistrées.
            </p>
            <p className="text-sm text-gray-500">
              Redirection en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifications de sécurité avant d'accéder aux questions
  console.log('=== VÉRIFICATION DES QUESTIONS ===');
  console.log('testData.questions:', (testData as any).questions);
  console.log('testData.questionList:', (testData as any).questionList);
  console.log('testData.testQuestions:', (testData as any).testQuestions);
  console.log('questions finales:', questions);
  console.log('Type de questions:', typeof questions);
  console.log('Est un array:', Array.isArray(questions));
  console.log('=== FIN VÉRIFICATION QUESTIONS ===');
  
  if (!questions || !Array.isArray(questions)) {
    console.error('Données de test invalides:', testData);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de chargement</h2>
            <p className="text-gray-600">Les données du test ne sont pas valides.</p>
            <Button 
              onClick={() => navigate('/candidate/login')}
              className="mt-4"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Aucune question</h2>
            <p className="text-gray-600">Ce test ne contient aucune question.</p>
            <Button 
              onClick={() => navigate('/candidate/login')}
              className="mt-4"
            >
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérifier que l'index est dans les limites
  if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
    console.error('Index de question hors limites:', currentQuestionIndex, 'Total questions:', questions.length);
    setCurrentQuestionIndex(0); // Réinitialiser à la première question
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // Vérification finale de sécurité
  if (!currentQuestion) {
    console.error('Question actuelle non trouvée à l\'index:', currentQuestionIndex);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de question</h2>
            <p className="text-gray-600">La question actuelle n'est pas disponible.</p>
            <Button 
              onClick={() => {
                setCurrentQuestionIndex(0);
              }}
              className="mt-4"
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Test Technique</h1>
              <Badge variant="outline">{testData.positionTitle}</Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-red-500" />
                <span className={`font-mono font-bold ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {getAnsweredCount()} / {questions.length} réponses
              </div>
            </div>
          </div>
          
          <Progress value={getProgress()} className="mt-2" />
        </div>
      </div>

      {!testStarted ? (
        // Page d'accueil du test
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                Bienvenue au test technique pour {testData.positionTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Vous êtes sur le point de commencer un test de {questions.length} questions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-bold">{testData.duration} minutes</div>
                    <div className="text-sm text-gray-600">Durée</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="font-bold">{questions.length}</div>
                    <div className="text-sm text-gray-600">Questions</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="font-bold">QCM</div>
                    <div className="text-sm text-gray-600">Type</div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-yellow-800 mb-2">Instructions importantes :</h3>
                  <ul className="text-sm text-yellow-700 space-y-1 text-left">
                    <li>• Le test est chronométré et ne peut pas être mis en pause</li>
                    <li>• Une fois commencé, vous devez le terminer</li>
                    <li>• Vous pouvez naviguer entre les questions</li>
                    <li>• Assurez-vous d'avoir une connexion internet stable</li>
                    <li>• Vos réponses sont sauvegardées automatiquement</li>
                  </ul>
                </div>
                
                <Button onClick={startTest} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Commencer le test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Interface du test
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Question {currentQuestionIndex + 1} / {questions.length}
                </CardTitle>
                <Badge variant="outline">{currentQuestion.skillTag}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">{currentQuestion.questionText}</h3>
                
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, index) => {
                    // Vérifier si l'option contient déjà un préfixe (A), B), C), etc. ou A., B., C., etc.
                    const hasPrefix = /^[A-D]\)|^[A-D]\./.test(option.trim());
                    const prefix = hasPrefix ? '' : `${String.fromCharCode(65 + index)}.`;
                    
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label 
                          htmlFor={`option-${index}`} 
                          className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-gray-50"
                        >
                          <span className="font-medium">{prefix}</span> {option}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Précédent
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={nextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    Suivant
                  </Button>
                </div>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <Button
                    onClick={submitTest}
                    disabled={isSubmitting || getAnsweredCount() < questions.length}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Soumission...' : 'Soumettre le test'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextQuestion}
                    variant="outline"
                  >
                    Passer à la question suivante
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CandidateTestPage;
