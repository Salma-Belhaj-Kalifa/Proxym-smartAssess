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
import { useGetPublicTest } from '@/features/tests/testsQueries';
import { useStartTest, useSubmitTest } from '@/features/tests/testsMutations';

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
      loadTestData(token);
    }
  }, [token]);

  // Effet pour traiter les données du hook quand elles arrivent
  useEffect(() => {
    if (testDataFromHook) {
      console.log('=== DONNÉES DU TEST REÇUES DU HOOK ===');
      console.log('Test data from hook:', testDataFromHook);
      
      processTestData(testDataFromHook);
    }
  }, [testDataFromHook]);

  const processTestData = (dataFromHook: any) => {
    try {
      console.log('=== DONNÉES COMPLÈTES DU TEST ===');
      console.log('Test data from hook:', dataFromHook);
      console.log('Test data keys:', Object.keys(dataFromHook || {}));
      
      // Backend returns {success: true, test: {...}} structure
      const test = dataFromHook.test || dataFromHook;
      console.log('Extracted test object:', test);
      console.log('Questions:', test?.questions);
      console.log('Questions type:', typeof test?.questions);
      console.log('Questions length:', test?.questions?.length);
      console.log('Is array:', Array.isArray(test?.questions));
      console.log('=== FIN DONNÉES TEST ===');
      
      // Créer un objet testData compatible avec ce que le frontend attend
      const testData = {
        testId: test?.id,
        duration: test?.timeLimitMinutes || 20,
        questions: test?.questions || [],
        positionTitle: 'Poste technique', // À améliorer si nécessaire
        token: token || '',
        candidateName: 'Candidat', // À améliorer si nécessaire
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h from now
      };
      
      console.log('Processed test data:', testData);
      
      setTestData(testData);
      setTimeRemaining(testData.duration * 60); // Convertir minutes en secondes
      setIsLoading(false); // ← Important: Set loading to false
      
      // Charger les réponses sauvegardées après avoir reçu les données du test
      setTimeout(() => {
        loadSavedAnswers();
      }, 100);
      
    } catch (error: any) {
      console.error('Error processing test data:', error);
      toast.error('Erreur lors du chargement du test');
      setIsLoading(false);
    }
  };

  const loadTestData = async (testToken: string) => {
    try {
      setIsLoading(true);
      console.log('Loading test data for token:', testToken);
      
      // Le hook useGetPublicTest est déjà appelé au niveau du composant
      // Cette fonction sert principalement à logger et à gérer l'état de chargement
      
    } catch (error: any) {
      console.error('Error loading test data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error('Erreur lors du chargement du test');
      setIsLoading(false);
    }
  };

  // Effet de sécurité : détection de changement d'onglet
  // Effet de sécurité : détection de changement d'onglet et sortie de fenêtre
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted && !testSubmitted) {
        setTabSwitchCount(prev => prev + 1);
        const warning = `⚠️ ALERTE : Changement d'onglet détecté (${tabSwitchCount + 1}/3) - Tentative de fraude enregistrée!`;
        setSecurityWarnings(prev => [...prev, warning]);
        toast.error(warning, { duration: 5000 });
        
        // Soumettre automatiquement le test après 3 changements d'onglet
        if (tabSwitchCount >= 2) {
          toast.error("🚨 Trop de changements d'onglet! Le test sera soumis automatiquement.", { duration: 5000 });
          setTimeout(() => {
            submitTest();
          }, 2000);
        }
      }
    };

    const handleBlur = () => {
      if (testStarted && !testSubmitted) {
        setTabSwitchCount(prev => prev + 1);
        const warning = `⚠️ ALERTE : Perte de focus détectée (${tabSwitchCount + 1}/3) - Ne quittez pas la fenêtre!`;
        setSecurityWarnings(prev => [...prev, warning]);
        toast.error(warning, { duration: 5000 });
        
        // Soumettre automatiquement le test après 3 pertes de focus
        if (tabSwitchCount >= 2) {
          toast.error("🚨 Trop de pertes de focus! Le test sera soumis automatiquement.", { duration: 5000 });
          setTimeout(() => {
            submitTest();
          }, 2000);
        }
      }
    };

    const handleFocus = () => {
      if (testStarted && !testSubmitted) {
        toast.warning("🔒 Restez sur cette page pendant le test", { duration: 3000 });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [testStarted, testSubmitted, tabSwitchCount]);

  // Effet de sécurité : détection de copier-coller
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (testStarted && !testSubmitted) {
        e.preventDefault();
        setCopyAttempts(prev => prev + 1);
        const warning = `Copier-coller détecté (${copyAttempts + 1})`;
        setSecurityWarnings(prev => [...prev, warning]);
        toast.warning('Le copier-coller est désactivé pendant le test');
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (testStarted && !testSubmitted) {
        e.preventDefault();
        setCopyAttempts(prev => prev + 1);
        const warning = `Coller détecté (${copyAttempts + 1})`;
        setSecurityWarnings(prev => [...prev, warning]);
        toast.warning('Le coller est désactivé pendant le test');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (testStarted && !testSubmitted) {
        e.preventDefault();
        toast.warning('Le clic droit est désactivé pendant le test');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (testStarted && !testSubmitted) {
        // Bloquer TOUS les raccourcis clavier sans exception
        if ((e.ctrlKey || e.metaKey) && 
            (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a' || e.key === 'w' || e.key === 'q')) {
          e.preventDefault();
          e.stopPropagation();
          toast.warning('Les raccourcis clavier sont désactivés pendant le test');
        }
        
        // Bloquer TOUTES les touches de fonction et de navigation
        if (e.key === 'F12' || e.key === 'F11' || e.key === 'F10' || e.key === 'F9' || e.key === 'F5' || e.key === 'F3' || e.key === 'F1') {
          e.preventDefault();
          e.stopPropagation();
          toast.error(`La touche ${e.key} est désactivée pendant le test`);
        }
        
        // Bloquer Ctrl+Shift+I/J/K/L, Alt+F4, etc.
        if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'K' || e.key === 'L')) ||
            (e.altKey && (e.key === 'F4' || e.key === 'Tab')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'W' || e.key === 'Q'))) {
          e.preventDefault();
          e.stopPropagation();
          toast.error('Les raccourcis de navigation sont désactivés');
        }
        
        // Bloquer la touche Échap avec une détection plus stricte
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toast.error('La touche Échap est complètement désactivée pendant le test');
          return false;
        }
        
        // Bloquer Alt+Tab, Ctrl+Tab, Windows+Tab
        if ((e.altKey && e.key === 'Tab') || (e.ctrlKey && e.key === 'Tab')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
        
        // Bloquer Windows Key, Command Key
        if (e.key === 'Meta' || e.key === 'OS') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    if (testStarted && !testSubmitted) {
      document.addEventListener('copy', handleCopy);
      document.addEventListener('paste', handlePaste);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);
      
      // Ajouter un écouteur au niveau de la fenêtre pour capturer F11
      const windowKeyDownHandler = (e: KeyboardEvent) => {
        if (testStarted && !testSubmitted && e.key === 'F11') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toast.error('F11 est désactivé pendant le test');
          return false;
        }
      };
      
      window.addEventListener('keydown', windowKeyDownHandler, true);
      
      return () => {
        document.removeEventListener('copy', handleCopy);
        document.removeEventListener('paste', handlePaste);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keydown', windowKeyDownHandler, true);
      };
    }
  }, [testStarted, testSubmitted, copyAttempts]);

  // Effet de sécurité : empêcher la sortie du mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testStarted && !testSubmitted) {
        toast.error('Le mode plein écran est OBLIGATOIRE pendant le test');
        
        // Forcer immédiatement le retour en plein écran
        const forceFullscreen = async () => {
          try {
            if (document.documentElement.requestFullscreen) {
              await document.documentElement.requestFullscreen();
            } else if ((document.documentElement as any).webkitRequestFullscreen) {
              await (document.documentElement as any).webkitRequestFullscreen();
            } else if ((document.documentElement as any).msRequestFullscreen) {
              await (document.documentElement as any).msRequestFullscreen();
            }
          } catch (error) {
            // Continuer d'essayer toutes les secondes
            console.warn('Tentative de plein écran échouée, nouvel essai...', error);
          }
        };
        
        // Essayer immédiatement
        forceFullscreen();
        
        // Réessayer toutes les secondes si toujours pas en plein écran
        const retryInterval = setInterval(() => {
          if (!document.fullscreenElement && testStarted && !testSubmitted) {
            forceFullscreen();
          } else {
            clearInterval(retryInterval);
          }
        }, 1000);
        
        // Nettoyer l'intervalle après 10 secondes max
        setTimeout(() => clearInterval(retryInterval), 10000);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testStarted && !testSubmitted) {
        e.preventDefault();
        e.returnValue = '🚨 ALERTE : Test en cours! Si vous quittez cette page, le test sera soumis automatiquement et vos réponses seront enregistrées. Voulez-vous vraiment continuer ?';
        return e.returnValue;
      }
    };

    const handlePageHide = (e: PageTransitionEvent) => {
      if (testStarted && !testSubmitted) {
        // Soumettre automatiquement le test si l'utilisateur essaie de quitter la page
        console.log('Page hide detected - submitting test automatically');
        submitTest();
      }
    };

    // Bloquer les raccourcis clavier pour sortir
    const handleKeyDown = (e: KeyboardEvent) => {
      if (testStarted && !testSubmitted) {
        // Bloquer Alt+Tab, Ctrl+W, Ctrl+T, F5, etc.
        if (
          e.key === 'F5' || 
          (e.ctrlKey && (e.key === 'w' || e.key === 't' || e.key === 'Tab')) ||
          (e.altKey && e.key === 'Tab')
        ) {
          e.preventDefault();
          toast.error('🔒 Cette action est bloquée pendant le test!', { duration: 3000 });
          return false;
        }
        
        // Bloquer la touche Échap pour sortir du plein écran
        if (e.key === 'Escape') {
          e.preventDefault();
          toast.error('🔒 La touche Échap est bloquée pendant le test!', { duration: 3000 });
          return false;
        }
      }
    };

    const handleGlobalContextMenu = (e: MouseEvent) => {
      if (testStarted && !testSubmitted) {
        e.preventDefault();
        toast.error('🔒 Le clic droit est bloqué pendant le test!', { duration: 3000 });
      }
    };

    if (testStarted && !testSubmitted) {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handlePageHide);
      document.addEventListener('contextmenu', handleGlobalContextMenu);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [testStarted, testSubmitted]);

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

  const startTest = async () => {
    if (!token) {
      toast.error('Token de test invalide');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Starting test with token:', token);
      
      // Activer le mode plein écran AVANT tout le reste
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          }
        } catch (error) {
          console.warn('Impossible d\'activer le plein écran automatiquement:', error);
          toast.error('Le mode plein écran est obligatoire pour commencer le test');
          return false;
        }
        return true;
      };
      
      // Attendre que le plein écran soit activé
      const fullscreenSuccess = await enterFullscreen();
      if (!fullscreenSuccess) {
        setIsLoading(false);
        return;
      }
      
      // Vérifier que nous sommes bien en plein écran
      if (!document.fullscreenElement) {
        toast.error('Le mode plein écran est obligatoire pour commencer le test');
        setIsLoading(false);
        return;
      }
      
      // Appeler l'endpoint de démarrage du test via le hook
      const startResponse = await startTestMutation.mutateAsync(Number(testData.testId));
      console.log('Test started successfully:', startResponse);
      
      setTestStarted(true);
      setTimeRemaining(testDataFromHook!.duration * 60);
      loadSavedAnswers();
      
      toast.success('Test démarré en mode plein écran. Toute tentative de sortie sera bloquée.');
      
    } catch (error: any) {
      console.error('Error starting test:', error);
      
      let errorMessage = 'Erreur lors du démarrage du test';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Test non valide';
      } else if (error.response?.status === 500) {
        errorMessage = error.response?.data?.error || 'Erreur serveur lors du démarrage du test';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Sortir du plein écran en cas d'erreur
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
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
      
      // Convertir les réponses en format attendu par le backend
      const formattedAnswers: Record<number, string> = {};
      Object.entries(answers).forEach(([questionId, answer]) => {
        formattedAnswers[parseInt(questionId)] = answer;
      });
      
      console.log('Formatted answers:', formattedAnswers);
      
      // Créer les données de soumission selon le format attendu par le backend
      const submissionData = {
        testId: testData.testId,
        answers: formattedAnswers,
        timeSpentMinutes: Math.floor(((testData.duration * 60) - timeRemaining) / 60),
        submittedAt: new Date().toISOString()
      };
      
      console.log('Données de soumission complètes:', JSON.stringify(submissionData, null, 2));
      
      // Utiliser le hook useSubmitTest déclaré au niveau du composant
      const response = await submitTestMutation.mutateAsync({ 
        testId: testData.testId, 
        answers: {
          token: token, // ← Required for backend validation
          answers: formattedAnswers, // ← Answers as Map
          timeSpent: (testData.duration * 60) - timeRemaining // ← Time spent in seconds
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
        navigate(`/test-submitted/${token}`);
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

      {testStarted && !testSubmitted && (
        // Panneau d'alerte de sécurité
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          {(tabSwitchCount > 0 || copyAttempts > 0 || securityWarnings.length > 0) && (
            <Card className="bg-red-50 border-red-200 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-red-800">Alertes de sécurité</h3>
                </div>
                <div className="space-y-1 text-sm">
                  {tabSwitchCount > 0 && (
                    <div className="text-red-700">
                      <strong>Changements d'onglet :</strong> {tabSwitchCount}
                    </div>
                  )}
                  {copyAttempts > 0 && (
                    <div className="text-red-700">
                      <strong>Tentatives de copier-coller :</strong> {copyAttempts}
                    </div>
                  )}
                  {securityWarnings.length > 0 && (
                    <div className="text-red-700">
                      <strong>Derniers avertissements :</strong>
                      <ul className="mt-1 space-y-1">
                        {securityWarnings.slice(-3).map((warning, index) => (
                          <li key={index} className="text-xs">• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-red-600">
                  Toutes les activités sont enregistrées et seront signalées.
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-red-800 mb-2">⚠️ AVERTISSEMENT IMPORTANT - MODE PLEIN ÉCRAN OBLIGATOIRE</h3>
                  <ul className="text-sm text-red-700 space-y-1 text-left">
                    <li>• <strong>Le mode plein écran s'activera automatiquement</strong> au début du test</li>
                    <li>• <strong>IL EST INTERDIT de quitter le mode plein écran</strong> pendant le test</li>
                    <li>• <strong>La touche Échap est complètement désactivée</strong></li>
                    <li>• <strong>Les raccourcis clavier (Ctrl+C, Ctrl+V, F12, etc.) sont bloqués</strong></li>
                    <li>• <strong>Le clic droit est désactivé</strong></li>
                    <li>• <strong>Toute tentative de sortie du plein écran sera immédiatement corrigée</strong></li>
                    <li>• <strong>Le changement d'onglet ou la fermeture de la page annulera le test</strong></li>
                    <li>• <strong>Assurez-vous d'être dans un environnement calme avant de commencer</strong></li>
                  </ul>
                  <div className="mt-3 p-2 bg-red-100 rounded text-red-800 text-xs font-bold">
                    En cliquant sur "Commencer le test", vous acceptez ces conditions de sécurité strictes.
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="font-bold text-yellow-800 mb-2">Instructions importantes :</h3>
                  <ul className="text-sm text-yellow-700 space-y-1 text-left">
                    <li>• Le test est chronométré et ne peut pas être mis en pause</li>
                    <li>• Une fois commencé, vous devez le terminer</li>
                    <li>• Assurez-vous d'avoir une connexion internet stable</li>
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