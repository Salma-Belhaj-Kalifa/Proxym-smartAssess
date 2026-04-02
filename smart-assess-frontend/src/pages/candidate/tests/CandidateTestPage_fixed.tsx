import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft,
  Send,
  Timer
} from 'lucide-react';
import apiClient from '@/lib/api';
import { useGetPublicTest } from '@/features/tests/testsQueries';
import { useStartTest, useSubmitTest } from '@/features/tests/testsMutations';
import { indexToCorrectAnswer } from '@/features/tests/testAnswerUtils';
import { toast } from 'sonner';

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
  id: number;
  testId: number;
  token: string;
  status: string;
  timeLimitMinutes: number;
  createdAt: string;
  deadline: string;
  duration: number;
  positionTitle: string;
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  questions: Question[];
}

const CandidateTestPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [testData, setTestData] = useState<TestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);

  // États de sécurité
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  // Utiliser le hook pour récupérer les données du test public uniquement si token est disponible
  const { data: testDataFromHook, isLoading: testLoading, error: testError } = useGetPublicTest(token || '');
  const startTestMutation = useStartTest();
  const submitTestMutation = useSubmitTest();

  useEffect(() => {
    if (token) {
      console.log('Fetching public test with token:', token);
      
      // Utiliser les données du hook si disponibles
      if (testDataFromHook?.test) {
        console.log('Using test data from hook:', testDataFromHook.test);
        setTestData(testDataFromHook.test);
        setIsLoading(false);
      } else if (testError) {
        console.error('Test error from hook:', testError);
        toast.error('Test non trouvé ou expiré');
        setIsLoading(false);
      }
    }
  }, [token, testDataFromHook, testError]);

  useEffect(() => {
    if (testError) {
      console.error('Error loading test data:', testError);
      toast.error('Failed to load test data');
    }
  }, [testError]);

  // 🎯 MODIFIER UNE RÉPONSE - Stocker l'index au lieu du texte
  const handleAnswerChange = (questionId: number, optionIndex: number) => {
    console.log(`=== RÉPONSE MODIFIÉE ===`);
    console.log(`Question ID: ${questionId}`);
    console.log(`Index de l'option: ${optionIndex}`);
    console.log(`Réponses avant:`, answers);
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: optionIndex
      };
      console.log(`Réponses après:`, newAnswers);
      console.log(`Total de réponses: ${Object.keys(newAnswers).length}`);
      
      // Auto-save des réponses dans localStorage
      if (testData && token) {
        const testIdToUse = testDataFromHook?.test?.id || testData?.testId || testDataFromHook?.id;
        const saveKey = `test_answers_${testIdToUse}_${token}`;
        localStorage.setItem(saveKey, JSON.stringify(newAnswers));
        console.log(`Réponses sauvegardées dans localStorage avec clé: ${saveKey}`);
      }
      
      return newAnswers;
    });
  };

  // Charger les réponses sauvegardées au démarrage
  const loadSavedAnswers = useCallback(() => {
    if (testData && token) {
      const testIdToUse = testDataFromHook?.test?.id || testData?.testId || testDataFromHook?.id;
      const saveKey = `test_answers_${testIdToUse}_${token}`;
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
  }, [testData, token, testDataFromHook]);

  // Nettoyer les réponses sauvegardées après soumission
  const clearSavedAnswers = () => {
    if (testData && token) {
      const testIdToUse = testDataFromHook?.test?.id || testData?.testId || testDataFromHook?.id;
      const saveKey = `test_answers_${testIdToUse}_${token}`;
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
    if (!testData) {
      console.error('No test data available for submission');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      console.log('=== DÉBUT SOUMISSION TEST ===');
      console.log('Test data:', testData);
      console.log('Token:', token);
      console.log('Answers actuels:', answers);
      console.log('Time remaining:', timeRemaining);
      
      // 🎯 CONVERTIR LES INDEX EN TEXTE POUR LE BACKEND
      const formattedAnswers: Record<number, string> = {};
      Object.entries(answers).forEach(([questionId, optionIndex]) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        if (question && question.options) {
          // Convertir l'index en texte complet de l'option
          formattedAnswers[parseInt(questionId)] = indexToCorrectAnswer(optionIndex, question.options);
        } else {
          // Fallback: envoyer l'index comme texte si la question n'est pas trouvée
          formattedAnswers[parseInt(questionId)] = optionIndex.toString();
        }
      });
      
      console.log('Formatted answers:', formattedAnswers);
      
      // Utiliser le hook useSubmitTest déclaré au niveau du composant
      const testIdToUse = testDataFromHook?.test?.id || testData?.testId || testDataFromHook?.id;
      const response = await submitTestMutation.mutateAsync({ 
        testId: testIdToUse, 
        answers: {
          token: token, // ← Required for backend validation
          answers: formattedAnswers, // ← Answers as Map
          timeSpent: ((testData?.duration || 20) * 60) - timeRemaining // ✅ Utiliser testData.duration
        }
      });
      
      console.log('Réponse du backend:', response);
      
      // Sortir du mode plein écran après soumission réussie
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      // Nettoyer les réponses sauvegardées
      clearSavedAnswers();
      
      setTestSubmitted(true);
      toast.success('Test soumis avec succès !');
      
      setTimeout(() => {
        navigate('/candidate/test-submitted');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error submitting test:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Erreur lors de la soumission du test');
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
                    <div className="font-bold">{testData?.duration || 20} minutes</div>
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
                
                <Button onClick={() => setTestStarted(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
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
              <h3 className="text-lg font-medium mb-4">{currentQuestion.questionText}</h3>
              
              {/* 🎯 RADIO GROUP - Utiliser les index au lieu du texte */}
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, parseInt(value))}
                className="space-y-3"
              >
                {currentQuestion.options.map((option, optionIndex) => {
                  // Vérifier si l'option contient déjà un préfixe (A), B), C), etc. ou A., B., C., etc.
                  const hasPrefix = /^[A-Z]\)|^[A-Z]\./i.test(option.trim());
                  const prefix = hasPrefix ? '' : `${String.fromCharCode(65 + optionIndex)}.`;
                  
                  return (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={optionIndex.toString()} id={`option-${optionIndex}`} />
                      <Label 
                        htmlFor={`option-${optionIndex}`} 
                        className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <span className="font-medium">{prefix}</span> {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              
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
