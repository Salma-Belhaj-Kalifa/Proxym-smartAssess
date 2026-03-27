import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Save, Timer, Brain, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'text' | 'coding';
  options?: string[];
  points: number;
  timeLimit?: number; // en minutes
}

interface TestResult {
  questionId: number;
  answer: string;
  timeSpent: number;
  isCorrect?: boolean;
}

const TestInterfacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<TestResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStartTime, setTestStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Questions de test fictives pour l'exemple
  const mockQuestions: Question[] = [
    {
      id: 1,
      text: "Quelle est la différence entre React et Vue.js ?",
      type: "multiple-choice",
      options: [
        "Vue est un framework, React est une bibliothèque",
        "React est plus rapide que Vue",
        "Vue n'a pas de composants",
        "Il n'y a pas de différence"
      ],
      points: 20,
      timeLimit: 5
    },
    {
      id: 2,
      text: "Décrivez votre expérience avec TypeScript et expliquez pourquoi vous l'utilisez.",
      type: "text",
      points: 30,
      timeLimit: 10
    },
    {
      id: 3,
      text: "Quelle approche utiliseriez-vous pour optimiser les performances d'une application React ?",
      type: "multiple-choice",
      options: [
        "Utiliser React.memo et useMemo",
        "Augmenter la taille des composants",
        "Désactiver le re-rendu",
        "Utiliser plus d'états globaux"
      ],
      points: 25,
      timeLimit: 7
    },
    {
      id: 4,
      text: "Décrivez un projet complexe que vous avez réalisé et les défis techniques que vous avez rencontrés.",
      type: "text",
      points: 25,
      timeLimit: 15
    }
  ];

  useEffect(() => {
    // Simuler le chargement du test
    const mockTest = {
      id: parseInt(id || '1'),
      title: "Test Technique Développeur Frontend",
      description: "Évaluation des compétences en développement web",
      duration: 20, // minutes par défaut
      totalPoints: 100
    };
    
    setTest(mockTest);
    setQuestions(mockQuestions);
    setTimeLeft(mockTest.duration * 60); // convertir en secondes
    setTestStartTime(Date.now());
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0 && !testCompleted) {
      handleSubmitTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, testCompleted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (answer: string) => {
    const existingAnswer = answers.find(a => a.questionId === currentQuestion.id);
    
    if (existingAnswer) {
      setAnswers(answers.map(a => 
        a.questionId === currentQuestion.id 
          ? { ...a, answer }
          : a
      ));
    } else {
      setAnswers([...answers, {
        questionId: currentQuestion.id,
        answer,
        timeSpent: 0
      }]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Calculer le score (simulation)
      let calculatedScore = 0;
      const results = answers.map(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        let isCorrect = false;
        
        if (question?.type === 'multiple-choice') {
          // Simulation: première option est correcte
          isCorrect = answer.answer === question.options?.[0];
          if (isCorrect) {
            calculatedScore += question.points;
          }
        } else {
          // Pour les questions textuelles, on attribue des points partiels
          isCorrect = answer.answer.length > 50; // Simple validation
          if (isCorrect) {
            calculatedScore += Math.floor(question.points * 0.8);
          }
        }
        
        return {
          ...answer,
          isCorrect,
          timeSpent: Math.floor(Math.random() * 300) // Simulation
        };
      });
      
      setScore(calculatedScore);
      setTestCompleted(true);
      
      // Simuler l'envoi au backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Test soumis avec succès !');
      
      // Rediriger après 3 secondes
      setTimeout(() => {
        navigate('/candidat/candidatures');
      }, 3000);
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast.error('Erreur lors de la soumission du test');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Chargement du test...</div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-2 border-green-200">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-800 mb-4">
                Test terminé avec succès !
              </h1>
              <div className="mb-8">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {score}/{test.totalPoints}
                </div>
                <div className="text-lg text-green-700">
                  Score obtenu
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Répartition des réponses</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <div className="text-green-600 font-semibold">
                      {answers.filter(a => a.isCorrect).length} réponses correctes
                    </div>
                    <div className="text-gray-600">
                      {answers.filter(a => !a.isCorrect).length} réponses incorrectes
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-gray-600">
                      Durée totale: {formatTime(Math.floor((Date.now() - testStartTime) / 1000))}
                    </div>
                    <div className="text-gray-600">
                      {answers.length} questions répondues
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm text-green-600">Redirection vers vos candidatures...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">{test.title}</h1>
              <Badge variant="outline" className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                {formatTime(timeLeft)}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} / {questions.length}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/candidat/candidatures')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quitter
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-3 h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  Question {currentQuestionIndex + 1}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    <span>{currentQuestion.points} points</span>
                  </div>
                  {currentQuestion.timeLimit && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{currentQuestion.timeLimit} min</span>
                    </div>
                  )}
                </div>
              </div>
              <Badge variant="secondary">
                {currentQuestion.type === 'multiple-choice' ? 'QCM' : 'Texte libre'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Question Text */}
              <div className="text-lg font-medium text-gray-900 leading-relaxed">
                {currentQuestion.text}
              </div>

              {/* Answer Options */}
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <RadioGroup 
                  value={answers.find(a => a.questionId === currentQuestion.id)?.answer || ''}
                  onValueChange={handleAnswerChange}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Text Answer */}
              {currentQuestion.type === 'text' && (
                <div>
                  <Textarea
                    value={answers.find(a => a.questionId === currentQuestion.id)?.answer || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Tapez votre réponse ici..."
                    className="min-h-[150px] text-base"
                  />
                  <div className="text-sm text-gray-500 mt-2">
                    {answers.find(a => a.questionId === currentQuestion.id)?.answer?.length || 0} caractères
                  </div>
                </div>
              )}

              {/* Coding Question (placeholder) */}
              {currentQuestion.type === 'coding' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Question de programmation
                  </h3>
                  <p className="text-gray-600 mb-4">
                    L'éditeur de code sera disponible prochainement
                  </p>
                  <Textarea
                    value={answers.find(a => a.questionId === currentQuestion.id)?.answer || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Collez votre code ici ou décrivez votre approche..."
                    className="min-h-[200px] font-mono"
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>

              <div className="flex gap-2">
                {questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestionIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 p-0 ${
                      answers.find(a => a.questionId === questions[index].id) 
                        ? 'bg-green-100 border-green-300 text-green-700' 
                        : ''
                    }`}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              <Button
                onClick={handleNextQuestion}
                disabled={!answers.find(a => a.questionId === currentQuestion.id)?.answer}
              >
                {currentQuestionIndex === questions.length - 1 ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Soumettre
                  </>
                ) : (
                  <>
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestInterfacePage;
