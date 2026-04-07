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
import { useStartTestByToken, useSubmitTest } from '@/features/tests/testsMutations';
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
  const startTestMutation = useStartTestByToken();
  const submitTestMutation = useSubmitTest();

  useEffect(() => {
    if (token) {
      console.log('Fetching public test with token:', token);
      
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

  const handleAnswerChange = (questionId: number, optionIndex: number) => {
   
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: optionIndex
      };
      console.log(`Réponses après:`, newAnswers);
      console.log(`Total de réponses: ${Object.keys(newAnswers).length}`);
      
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
      
      const formattedAnswers: Record<number, string> = {};
      Object.entries(answers).forEach(([questionId, optionIndex]) => {
        const question = questions.find(q => q.id === parseInt(questionId));
        if (question && question.options) {
          formattedAnswers[parseInt(questionId)] = indexToCorrectAnswer(optionIndex, question.options);
        } else {
          formattedAnswers[parseInt(questionId)] = optionIndex.toString();
        }
      });
      
      console.log('Formatted answers:', formattedAnswers);
      
      const testIdToUse = testDataFromHook?.test?.id || testData?.testId || testDataFromHook?.id;
      const response = await submitTestMutation.mutateAsync({ 
        testId: testIdToUse, 
        answers: {
          token: token, 
          answers: formattedAnswers, 
          timeSpent: ((testData?.duration || 20) * 60) - timeRemaining // ✅ Utiliser testData.duration
        }
      });
      
      console.log('Réponse du backend:', response);
      
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

  // 🎯 FONCTION POUR DÉMARRER LE TEST
  const handleStartTest = async () => {
    if (!testData || !token) return;
    
    try {
      
      // Appeler l'API pour démarrer le test avec le token
      await startTestMutation.mutateAsync(token);
      
      // Initialiser le chronomètre avec la bonne durée
      const duration = testData?.timeLimitMinutes || testData?.duration || 20;
      console.log('Using duration:', duration, 'minutes');
      setTimeRemaining(duration * 60);
      setTestStarted(true);
      
      // Activer le mode plein écran
      try {
        await document.documentElement.requestFullscreen();
      } catch (error) {
        console.warn('Could not enter fullscreen mode:', error);
        toast.warning('Veuillez activer le mode plein écran manuellement (F11)');
      }
      
      // Charger les réponses sauvegardées
      loadSavedAnswers();
      
      toast.success('Test démarré ! Bonne chance !');
      
    } catch (error: any) {
      console.error('Error starting test:', error);
      toast.error('Erreur lors du démarrage du test');
    }
  };

  // 🎯 GESTION DU CHRONOMÈTRE
  useEffect(() => {
    if (!testStarted || testSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testSubmitted, timeRemaining]);

  useEffect(() => {
    if (!testStarted || testSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        setSecurityWarnings(prev => [...prev, 'Changement d\'onglet détecté']);
        toast.warning('Changement d\'onglet détecté !');
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts(prev => prev + 1);
      setSecurityWarnings(prev => [...prev, 'Tentative de copie détectée']);
      toast.warning('Copie interdite !');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning('Clic droit désactivé !');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U mais autoriser F11 et ESC pour la soumission
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        toast.warning('Outils de développement désactivés !');
      }
      // Ne plus bloquer F11 et Escape pour permettre la sortie du plein écran
    };

    // Soumettre automatiquement le test en cas de sortie du plein écran
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testStarted && !testSubmitted) {
        toast.error('Sortie du mode plein écran détectée ! Le test va être soumis automatiquement.');
        
        // Soumettre le test immédiatement
        setTimeout(() => {
          submitTest();
        }, 1000);
      }
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [testStarted, testSubmitted]);

  // 🎯 NETTOYAGE DES CONTRÔLES APRÈS SOUMISSION
  useEffect(() => {
    if (testSubmitted) {
      // Sortir du plein écran
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
          console.warn('Could not exit fullscreen');
        });
      }
      
      // Nettoyer tous les écouteurs d'événements
      const handleCleanup = () => {
        document.removeEventListener('visibilitychange', () => {});
        document.removeEventListener('copy', () => {});
        document.removeEventListener('contextmenu', () => {});
        document.removeEventListener('keydown', () => {});
        document.removeEventListener('fullscreenchange', () => {});
      };
      
      handleCleanup();
    }
  }, [testSubmitted]);

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
                
                {/* 🎯 INSTRUCTIONS AVANT DÉMARRAGE */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Instructions importantes
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-2 text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Le test sera en mode plein écran automatiquement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Changement d'onglet sera détecté et enregistré</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Copie, clic droit et outils de développement sont désactivés</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Vos réponses sont sauvegardées automatiquement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Le test se soumettra automatiquement à la fin du temps imparti</span>
                    </li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-bold">{testData?.timeLimitMinutes || testData?.duration || 20} minutes</div>
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
                
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Attention :</strong> Assurez-vous d'avoir une connexion internet stable 
                    et de ne pas être dérangé pendant le test.
                  </p>
                </div>
                
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Important : Mode plein écran obligatoire</strong><br/>
                    Le test doit être passé en mode plein écran. <strong>Toute sortie du mode plein écran 
                    (touche ESC, F11, ou fermeture du navigateur) entraînera la soumission automatique 
                    et immédiate du test.</strong>
                  </p>
                </div>
                
                <Button onClick={handleStartTest} size="lg" className="bg-blue-600 hover:bg-blue-700" disabled={startTestMutation.isPending}>
                  {startTestMutation.isPending ? 'Démarrage...' : 'Commencer le test'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Interface du test
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* AVERTISSEMENT MODE PLEIN ÉCRAN */}
          <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h4 className="font-semibold text-orange-800">Mode plein écran obligatoire</h4>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              <strong>Toute sortie du mode plein écran entraînera la soumission automatique et immédiate du test.</strong><br/>
              Le test doit être complété en une seule session sans interruption.
            </p>
          </div>
          
          {/* AVERTISSEMENTS DE SÉCURITÉ */}
          {securityWarnings.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Avertissements de sécurité:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {securityWarnings.slice(-3).map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
              <div className="text-xs text-red-600 mt-2">
                Changements d'onglet: {tabSwitchCount} | Tentatives de copie: {copyAttempts}
              </div>
            </div>
          )}
          
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
