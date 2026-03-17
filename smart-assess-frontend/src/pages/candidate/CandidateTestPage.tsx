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
      const response = await apiClient.get(`/tests/public/${testToken}`);
      const data = response.data;
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setTestData(data);
      setTimeRemaining(data.duration * 60); // Convertir minutes en secondes
      
      console.log('Test data loaded:', data);
    } catch (error: any) {
      console.error('Error loading test data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors du chargement du test: ${errorMessage}`);
      navigate('/');
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
      const response = await apiService.testService.startTest(token);
      
      if (response.success) {
        setTestStarted(true);
        setTimeRemaining(testData?.duration * 60 || 3600); // Convertir en secondes
        toast.success('Test démarré ! Bonne chance !');
        console.log('Test session created:', response.sessionId);
      } else {
        toast.error(response.error || 'Erreur lors du démarrage du test');
      }
    } catch (error: any) {
      console.error('Error starting test:', error);
      if (error.response?.status === 409) {
        toast.error('Le test a déjà été commencé');
        setTestStarted(true); // Permettre de continuer si déjà commencé
      } else {
        toast.error('Erreur lors du démarrage du test');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (testData?.questions.length || 0) - 1) {
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
      
      // Convertir les réponses en format attendu par le backend
      const formattedAnswers: Record<number, string> = {};
      Object.entries(answers).forEach(([questionId, answer]) => {
        formattedAnswers[parseInt(questionId)] = answer;
      });
      
      const submissionData = {
        testId: testData.testId,
        token: testData.token,
        answers: formattedAnswers,
        timeSpent: (testData.duration * 60) - timeRemaining
      };
      
      console.log('Submitting test with data:', submissionData);
      
      const response = await apiClient.post(`/tests/${testData.testId}/submit`, submissionData);
      
      setTestSubmitted(true);
      toast.success('Test soumis avec succès !');
      
      // Rediriger vers la page de confirmation avec les résultats
      setTimeout(() => {
        navigate('/candidate/test-submitted', { 
          state: { testResult: response.data } 
        });
      }, 3000);
      
    } catch (error: any) {
      console.error('Error submitting test:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur inconnue';
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
    return ((currentQuestionIndex + 1) / testData.questions.length) * 100;
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

  const currentQuestion = testData.questions[currentQuestionIndex];

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
                {getAnsweredCount()} / {testData.questions.length} réponses
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
                  Vous êtes sur le point de commencer un test de {testData.questions.length} questions.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="font-bold">{testData.duration} minutes</div>
                    <div className="text-sm text-gray-600">Durée</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="font-bold">{testData.questions.length}</div>
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
                  Question {currentQuestionIndex + 1} / {testData.questions.length}
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
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                      </Label>
                    </div>
                  ))}
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
                    disabled={currentQuestionIndex === testData.questions.length - 1}
                  >
                    Suivant
                  </Button>
                </div>
                
                {currentQuestionIndex === testData.questions.length - 1 ? (
                  <Button
                    onClick={submitTest}
                    disabled={isSubmitting || getAnsweredCount() < testData.questions.length}
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
