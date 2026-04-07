import React, { useState, useEffect, useMemo } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import { useTestReview } from '@/features/tests/testsQueries';
import { testKeys } from '@/features/tests/testsKeys';
import { TestReviewData, Question as BackendQuestion } from '@/features/tests/types';
import { useUpdateTest } from '@/features/tests/testsMutations';
import { useCandidatures } from '@/features/candidatures/candidaturesQueries';
import {
  correctAnswerToIndex,
  indexToCorrectAnswer,
  parseOptionsFromApi,
  adjustCorrectIndexAfterRemove,
  isCorrectOptionIndex,
  stripOptionIndexPrefix,
} from '@/features/tests/testAnswerUtils';

// Type local pour le frontend avec index
interface Question extends Omit<BackendQuestion, 'correctAnswer'> {
  correctAnswer: number; // Frontend: index (0, 1, 2, 3...)
}

/** Valide toutes les questions ; utilisé avant tout PUT (le backend remplace la liste entière). */
const validateAndCleanQuestionsForSave = (questions: Question[]): Question[] | null => {
  const out: Question[] = [];
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const cleanedOptions = question.options.filter((o) => o.trim() !== '');
    if (!question.questionText.trim()) {
      toast.error(`La question ${index + 1} n'a pas de texte`);
      return null;
    }
    if (cleanedOptions.length < 2) {
      toast.error(`La question ${index + 1} doit avoir au moins 2 options`);
      return null;
    }
    const correctAnswerIndex = question.correctAnswer as unknown as number;
    if (correctAnswerIndex < 0 || correctAnswerIndex >= cleanedOptions.length) {
      toast.error(`La question ${index + 1} n'a pas de réponse correcte valide`);
      return null;
    }
    out.push({ ...question, options: cleanedOptions, orderIndex: index });
  }
  return out;
};

const TestReviewPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { data: candidatures = [] } = useCandidatures();
  const [testData, setTestData] = useState<TestReviewData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [testLink, setTestLink] = useState<string>('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [localQuestions, setLocalQuestions] = useState<Question[]>([]);

  // 🎯 FONCTION POUR NORMALISER LES RÉPONSES API
  const normalizeApiResponse = (rawQuestions: any[]): Question[] => {
    console.log('=== NORMALIZE API RESPONSE ===');
    console.log('Raw questions from backend:', rawQuestions);
    
    const normalized = rawQuestions.map(q => {
      const options = parseOptionsFromApi(q.options);
      const originalCorrectAnswer = q.correctAnswer;
      const originalCorrectAnswerIndex = q.correctAnswerIndex;
      
      // 🎯 PRIORITÉ: Utiliser correctAnswerIndex si disponible
      let finalIndex = 0;
      if (originalCorrectAnswerIndex !== null && originalCorrectAnswerIndex !== undefined && typeof originalCorrectAnswerIndex === 'number') {
        finalIndex = originalCorrectAnswerIndex;
        console.log(`Question ID: ${q.id || 'N/A'} - Using correctAnswerIndex: ${finalIndex}`);
      } else {
        // Fallback: convertir depuis le texte
        const correctAnswerStr = typeof originalCorrectAnswer === 'string' ? originalCorrectAnswer : String(originalCorrectAnswer || '');
        finalIndex = correctAnswerToIndex(correctAnswerStr, options);
        console.log(`Question ID: ${q.id || 'N/A'} - Converting from text: "${correctAnswerStr}" -> index: ${finalIndex}`);
      }
      
      console.log(`  Options: [${options.join(', ')}]`);
      console.log(`  Final index: ${finalIndex}`);
      
      return {
        ...q,
        options,
        correctAnswer: finalIndex,
      };
    }) as unknown as Question[];
    
    console.log('Normalized questions for frontend:', normalized);
    return normalized;
  };
  
  // 🎯 UTILISER useTestReview pour récupérer les données du test (contient les questions)
  const queryClient = useQueryClient();
  const { data: reviewData, isLoading, error } = useTestReview(testId ? parseInt(testId) : 0);
  const updateTestMutation = useUpdateTest();
  
  // 🎯 EXTRAIRE LES QUESTIONS depuis reviewData
  const questions = reviewData?.questions || [];

  // Trouver tous les postes du candidat
  const candidatePositions = useMemo(() => {
    if (!testData?.candidate?.id) return [];
    return candidatures.filter(c => c.candidateId === testData.candidate.id);
  }, [candidatures, testData?.candidate?.id]);

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

  // 🎯 SYNCHRONISER LES QUESTIONS LOCALES
  useEffect(() => {
    if (questions) {
      // Utiliser normalizeApiResponse pour convertir texte → index
      setLocalQuestions(normalizeApiResponse(questions));
    }
  }, [questions]);

  // 🎯 SYNCHRONISER testData avec les questions locales (y compris liste vide après suppression)
  useEffect(() => {
    setTestData((prev) =>
      prev ? { ...prev, questions: localQuestions as unknown as BackendQuestion[] } : prev
    );
  }, [localQuestions]);

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...localQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setLocalQuestions(updatedQuestions);
    console.log('Question updated locally:', { index, field, value });
  };

  const addOption = (questionIndex: number) => {
    if (!localQuestions[questionIndex]) return;
    
    const updatedQuestions = [...localQuestions];
    const currentOptions = [...(updatedQuestions[questionIndex].options || [])];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...currentOptions, '']
    };
    setLocalQuestions(updatedQuestions);
    
    console.log('Option added to question:', questionIndex);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    if (!localQuestions[questionIndex]) return;
    
    const updatedQuestions = [...localQuestions];
    const currentOptions = [...(updatedQuestions[questionIndex].options || [])];
    currentOptions[optionIndex] = value;
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: currentOptions
    };
    setLocalQuestions(updatedQuestions);
    
    console.log('Option updated:', { questionIndex, optionIndex, value });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    if (!localQuestions[questionIndex]) return;
    
    const updatedQuestions = [...localQuestions];
    const q = updatedQuestions[questionIndex];
    const currentOptions = [...q.options];
    const correctIdx =
      typeof q.correctAnswer === 'number'
        ? q.correctAnswer
        : correctAnswerToIndex(q.correctAnswer, currentOptions);
    currentOptions.splice(optionIndex, 1);
    const newCorrect = adjustCorrectIndexAfterRemove(
      correctIdx,
      optionIndex,
      currentOptions.length
    );
    updatedQuestions[questionIndex] = {
      ...q,
      options: currentOptions,
      correctAnswer: newCorrect,
    };
    setLocalQuestions(updatedQuestions);
  };

  const saveQuestionChanges = async (questionIndex: number) => {
    if (!localQuestions[questionIndex]) return;

    const currentTestId = testData?.id || testData?.testId;

    if (!currentTestId || typeof currentTestId !== 'number' || currentTestId <= 0) {
      toast.error('ID de test invalide pour la sauvegarde');
      return;
    }

    const cleaned = validateAndCleanQuestionsForSave(localQuestions);
    if (!cleaned) return;

    try {
      const response = await apiClient.put(`/tests/${currentTestId}/questions`, {
        questions: cleaned.map((q, i) => {
          // 🎯 CORRECTION: Le backend envoie maintenant le texte de l'option pour correctAnswer
          // Il faut le convertir en index pour le frontend
          let correctAnswerIndex = 0;
          if (typeof q.correctAnswer === 'number') {
            correctAnswerIndex = q.correctAnswer;
          } else if (typeof q.correctAnswer === 'string') {
            // Si c'est une chaîne numérique
            const correctAnswerStr = q.correctAnswer as string;
            if (/^\d+$/.test(correctAnswerStr.trim())) {
              correctAnswerIndex = parseInt(correctAnswerStr.trim(), 10);
            } else {
              // Si c'est du texte, trouver l'index correspondant
              correctAnswerIndex = correctAnswerToIndex(correctAnswerStr, q.options);
            }
          }
          
          // 🎯 NETTOYER LES CHAMPS - ne garder que ce que le backend attend
          return {
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            correctAnswer: q.correctAnswer,
            correctAnswerIndex: correctAnswerIndex,
            skillTag: q.skillTag,
            maxScore: q.maxScore,
            orderIndex: i,
          };
        }),
      });

      if (response.data.success) {
        toast.success('Question enregistrée');
        if (response.data.questions) {
          setLocalQuestions(normalizeApiResponse(response.data.questions));
        }
        setEditingQuestion(null);
        const tid = testId ? parseInt(testId, 10) : 0;
        if (tid > 0) {
          queryClient.invalidateQueries({ queryKey: testKeys.details(tid) });
        }
      } else {
        toast.error(response.data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Error saving question:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    }
  };

  const closeQuestionEdit = async (index: number) => {
    await saveQuestionChanges(index);
  };

  const isOptionCorrect = (optionIndex: number, question: Question): boolean =>
    isCorrectOptionIndex(optionIndex, question.correctAnswer, question.options);

  // 🎯 LOGIQUE DE SUPPRESSION : Utiliser l'API dédiée
  const deleteQuestion = async (index: number) => {
    if (!localQuestions[index]) return;
    
    const questionToDelete = localQuestions[index];

    if (!questionToDelete.id) {
      setLocalQuestions((prev) => prev.filter((_, i) => i !== index));
      setEditingQuestion((ed) => {
        if (ed === null) return null;
        if (ed === index) return null;
        if (ed > index) return ed - 1;
        return ed;
      });
      toast.success('Brouillon supprimé');
      return;
    }

    try {
      console.log('Deleting question from database - questionId:', questionToDelete.id, 'testId:', testId);
      
      // 🎯 UTILISER L'ANCIEN ENDPOINT pour la suppression
      const response = await apiClient.delete(`/tests/${testId}/questions/${questionToDelete.id}`);
      
      if (response.data.success) {
        toast.success('Question supprimée avec succès');
        if (Array.isArray(response.data.questions)) {
          setLocalQuestions(normalizeApiResponse(response.data.questions));
        } else {
          setLocalQuestions((prev) => prev.filter((_, i) => i !== index));
        }
        setEditingQuestion((ed) => {
          if (ed === null) return null;
          if (ed === index) return null;
          if (ed > index) return ed - 1;
          return ed;
        });
        const tid = testId ? parseInt(testId, 10) : 0;
        if (tid > 0) {
          queryClient.invalidateQueries({ queryKey: testKeys.details(tid) });
        }
      } else {
        toast.error(response.data.error || 'Erreur lors de la suppression');
      }
      
    } catch (error: any) {
      console.error('Error deleting question:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    }
  };

  const addNewQuestion = () => {
    if (!testData?.id && !testData?.testId) {
      toast.error('ID de test invalide');
      return;
    }

    const newQuestion: Question = {
      questionText: '',
      questionType: 'MCQ',
      options: ['', '', '', ''],
      correctAnswer: 0,
      skillTag: '',
      maxScore: 10.0,
      orderIndex: 0,
    };

    setLocalQuestions((prev) => [newQuestion, ...prev]);
    setEditingQuestion(0);
    toast.info('Rédigez la question et les réponses, puis cliquez sur Valider pour enregistrer.');
  };

  const saveQuestions = async () => {
    if (localQuestions.length === 0) {
      toast.error('Aucune question à sauvegarder');
      return;
    }
    
    const currentTestId = testData?.id || testData?.testId;
    
    if (!currentTestId || typeof currentTestId !== 'number' || currentTestId <= 0) {
      toast.error('ID de test invalide');
      return;
    }
    
    const cleanedQuestions = validateAndCleanQuestionsForSave(localQuestions);
    if (!cleanedQuestions) return;
    
    try {
      setIsSaving(true);
      console.log('=== SAVE QUESTIONS DEBUG ===');
      console.log('Local questions before save:', localQuestions);
      console.log('Cleaned questions:', cleanedQuestions);
      
      // 🎯 UTILISER les nouvelles fonctions utilitaires
      const questionsForBackend = cleanedQuestions.map((q, i) => {
        const correctAnswerText = indexToCorrectAnswer(q.correctAnswer as unknown as number, q.options);
        console.log(`Question ${i}:`);
        console.log(`  Local correctAnswer (index): ${q.correctAnswer}`);
        console.log(`  Options: [${q.options.join(', ')}]`);
        console.log(`  Backend correctAnswer (text): "${correctAnswerText}"`);
        
        // 🎯 NETTOYER LES CHAMPS - ne garder que ce que le backend attend
        return {
          id: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options,
          correctAnswer: correctAnswerText,
          correctAnswerIndex: q.correctAnswer as number,
          skillTag: q.skillTag,
          maxScore: q.maxScore,
          orderIndex: i,
        };
      });
      
      console.log('Final payload for backend:', questionsForBackend);
      
      const response = await apiClient.put(`/tests/${currentTestId}/questions`, {
        questions: questionsForBackend
      });
      
      if (response.data.success) {
        toast.success('Questions sauvegardées avec succès');
        if (response.data.questions) {
          setLocalQuestions(normalizeApiResponse(response.data.questions));
        }
        const tid = testId ? parseInt(testId, 10) : 0;
        if (tid > 0) {
          queryClient.invalidateQueries({ queryKey: testKeys.details(tid) });
        }
      } else {
        toast.error(response.data.error || 'Erreur lors de la sauvegarde');
      }
      
    } catch (error: any) {
      console.error('Error saving questions:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erreur inconnue';
      toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const generateTestLink = async () => {
    if (!testData) return;
    
    const currentTestId = testData.id || testData.testId;
    
    if (!currentTestId || typeof currentTestId !== 'number' || currentTestId <= 0) {
      toast.error('ID de test invalide');
      return;
    }
    
    try {
      setIsGeneratingLink(true);
      
      // Déterminer si le test est en DRAFT basé sur le status
      const isDraft = testData.status === 'DRAFT';
      console.log('GenerateTestLink - Test is DRAFT:', isDraft);
      
      // Si le test est en DRAFT, sauvegarder les questions en base pour la première fois
      if (isDraft) {
        console.log('GenerateTestLink - Using testId for API:', currentTestId);

        const cleanedForLink = validateAndCleanQuestionsForSave(localQuestions);
        if (!cleanedForLink) {
          setIsGeneratingLink(false);
          return;
        }

        const response = await apiClient.put(`/tests/${currentTestId}/questions`, {
          questions: cleanedForLink.map((q, i) => {
            const correctAnswerText = indexToCorrectAnswer(
              correctAnswerToIndex(q.correctAnswer, q.options),
              q.options
            );
            
            // 🎯 NETTOYER LES CHAMPS - ne garder que ce que le backend attend
            return {
              id: q.id,
              questionText: q.questionText,
              questionType: q.questionType,
              options: q.options,
              correctAnswer: correctAnswerText,
              correctAnswerIndex: correctAnswerToIndex(q.correctAnswer, q.options),
              skillTag: q.skillTag,
              maxScore: q.maxScore,
              orderIndex: i,
            };
          }),
        });
        
        if (response.data.success) {
          toast.success('Questions sauvegardées en base avec succès');
          
          // Mettre à jour le statut de la candidature à TEST_SENT
          try {
            const candidatureId = (testData as any).candidatureId;
            
            if (candidatureId && typeof candidatureId === 'number') {
              console.log(`Updating candidature ${candidatureId} status to TEST_SENT`);
              const statusResponse = await apiClient.put(`/candidatures/${candidatureId}/status`, {
                status: 'TEST_SENT'
              });
              console.log('Candidature status updated successfully:', statusResponse.data);
            } else {
              console.error('Invalid candidatureId:', candidatureId);
              toast.warning('Le lien a été généré mais le statut de la candidature n\'a pas pu être mis à jour.');
            }
          } catch (error: any) {
            console.error('Error updating candidature status:', error);
            toast.warning('Le lien a été généré mais la mise à jour du statut a échoué.');
          }
        } else {
          toast.error(response.data.error || 'Erreur lors de la sauvegarde');
        }
      }
      
      // Informer l'utilisateur que la génération peut prendre du temps
      toast.info('Génération du lien du test en cours...');
      
      // Générer le lien du test
      console.log('GenerateTestLink - Using testId for generate-link API:', currentTestId);
      const response = await apiClient.post(`/tests/${currentTestId}/generate-link`, {}, {
        timeout: 30000 // 30 secondes au lieu de 10 secondes
      });
      const data = response.data;
      
      console.log('GenerateTestLink - API response:', data);
      
      // Use token from API response with fallbacks
      let token = data.token || testData.token;
      
      if (!token) {
        console.warn('GenerateTestLink - No token in API response, checking testData...');
        token = testData.token;
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
      }, 10000);
      
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
        customMessage: `Bonjour ${testData.candidate?.firstName} ${testData.candidate?.lastName},\n\nVous êtes invité à passer un test technique.\n\nVoici votre lien personnel : ${testLink}\n\nCordialement,\nL'équipe de recrutement`
      };
      
      const currentTestId = testData.id || testData.testId;
      const response = await apiClient.post(`/tests/${currentTestId}/send-email`, emailData);
      
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
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/manager/generate-test')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour à la génération
                </Button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Révision du Test</h1>
                  <p className="text-sm text-gray-600">
                    {testData.candidate?.firstName} {testData.candidate?.lastName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={addNewQuestion}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une question
                </Button>
                
                <Button
                  onClick={generateTestLink}
                  disabled={isGeneratingLink || localQuestions.length === 0}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isGeneratingLink ? 'Génération...' : 'Valider et générer le lien'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 font-bold">❓</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="font-semibold text-gray-900">{localQuestions.length}</p>
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
                  <div>
                    <p className="font-semibold text-gray-900">{testData.candidate?.firstName} {testData.candidate?.lastName}</p>
                    <p className="text-xs text-gray-500">{testData.candidate?.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {localQuestions.length === 0 ? (
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
                  <p className="text-gray-600 mb-4">
                    Possible cause: L'IA n'a pas pu générer les questions automatiquement.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Solution: Vous pouvez ajouter manuellement les questions ci-dessous ou régénérer le test.
                  </p>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => navigate('/manager/generate-test')}
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
            localQuestions.map((question, index) => (
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
                    </CardTitle>
                    
                    <div className="flex items-center gap-2">
                      {editingQuestion === index ? (
                        <Button
                          onClick={() => closeQuestionEdit(index)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Valider
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setEditingQuestion(index)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Modifier
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => deleteQuestion(index)}
                        size="sm"
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  {editingQuestion === index ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${index}`}>Question</Label>
                        <Textarea
                          id={`question-${index}`}
                          value={question.questionText}
                          onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                          placeholder="Entrez votre question ici..."
                          className="min-h-[100px]"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`skill-${index}`}>Compétence</Label>
                        <Input
                          id={`skill-${index}`}
                          value={question.skillTag || ''}
                          onChange={(e) => updateQuestion(index, 'skillTag', e.target.value)}
                          placeholder="ex: JavaScript, React, Node.js..."
                        />
                      </div>
                      
                      <div>
                        <Label>Options</Label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                  className={isOptionCorrect(optionIndex, question) ? 'bg-green-50 border-green-200' : ''}
                                />
                              </div>
                              
                              {question.options.length > 2 && (
                                <Button
                                  onClick={() => removeOption(index, optionIndex)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          
                          {question.options.length < 6 && (
                            <Button
                              onClick={() => addOption(index)}
                              size="sm"
                              variant="outline"
                              className="mt-2"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter une option
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`correct-${index}`}>Réponse correcte</Label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <input
                                type="radio"
                                id={`correct-${index}-${optionIndex}`}
                                name={`correct-${index}`}
                                value={optionIndex}
                                checked={isOptionCorrect(optionIndex, question)}
                                onChange={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <label 
                                htmlFor={`correct-${index}-${optionIndex}`}
                                className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer"
                              >
                                {/* 🎯 CORRECTION: Ne pas ajouter d'index si l'option en contient déjà un */}
                                {!option.match(/^[A-Z]\)/) && (
                                  <span>{String.fromCharCode(65 + optionIndex)})</span>
                                )}
                                <span className="ml-2">
                                  {stripOptionIndexPrefix(option, optionIndex)}
                                </span>
                                {isOptionCorrect(optionIndex, question) && (
                                  <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{question.questionText}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Type: {question.questionType} | Compétence: {question.skillTag || 'Non spécifiée'}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-2">Options:</h4>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex} 
                              className={`flex items-center gap-2 p-3 rounded-lg border ${
                                isOptionCorrect(optionIndex, question) 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-medium text-gray-900">
                                {/* 🎯 CORRECTION: Ne pas ajouter d'index si l'option en contient déjà un */}
                                {!option.match(/^[A-Z]\)/) && (
                                  <span>{String.fromCharCode(65 + optionIndex)})</span>
                                )}
                              </span>
                              <span>{stripOptionIndexPrefix(option, optionIndex)}</span>
                              {isOptionCorrect(optionIndex, question) && (
                                <span className="ml-2 text-green-600 font-medium">✓</span>
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
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lien du test généré</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-link">Lien du test</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-link"
                    value={testLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Actions</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowLinkModal(false)}
                    variant="outline"
                  >
                    Fermer
                  </Button>
                  <Button
                    onClick={sendTestEmail}
                    disabled={isSendingEmail}
                    className="flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {isSendingEmail ? 'Envoi en cours...' : 'Envoyer par email'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestReviewPage;
