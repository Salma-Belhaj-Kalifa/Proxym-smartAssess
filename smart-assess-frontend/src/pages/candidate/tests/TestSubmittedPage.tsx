import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowLeft, Trophy, Clock } from 'lucide-react';

interface TestResult {
  success: boolean;
  testId: number;
  totalScore: number;
  maxPossibleScore: number;
  scorePercentage: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  message: string;
}

const TestSubmittedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    // Récupérer les résultats depuis le state de navigation
    if (location.state?.testResult) {
      setTestResult(location.state.testResult);
    }
  }, [location.state]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl mb-2">Test soumis avec succès !</CardTitle>
          
          <p className="text-gray-600 mb-6">
            Merci d'avoir complété le test technique. Vos réponses ont été enregistrées et seront évaluées par notre équipe.
          </p>
          
          {!testResult && (
            <p className="text-sm text-gray-500 mb-8">
              Les résultats seront disponibles prochainement. Vous serez notifié dès qu'ils seront prêts.
            </p>
          )}
        
        </CardContent>
      </Card>
    </div>
  );
};

export default TestSubmittedPage;
