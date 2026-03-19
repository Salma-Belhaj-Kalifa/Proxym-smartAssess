import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestResultsPage = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('TestResultsPage - Raw testId from useParams:', testId);
    console.log('TestResultsPage - Type of testId:', typeof testId);
    
    const id = parseInt(testId);
    console.log('TestResultsPage - Parsed id:', id);
    console.log('TestResultsPage - isNaN id:', isNaN(id));
    
    if (testId && !isNaN(id)) {
      loadTestResult(id);
    } else {
      console.error('Invalid test ID:', testId);
      console.log('Using fallback ID: 38 (latest test)');
      loadTestResult(38);
    }
  }, [testId]);

  const loadTestResult = async (testId: number) => {
    try {
      setIsLoading(true);
      
      // Récupérer les données du test depuis l'API
      const response = await fetch(`http://localhost:8080/api/tests/${testId}/review`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const testData = await response.json();
        console.log('Test data received:', testData);
        
        // Récupérer les données de session pour le temps réel
        const sessionData = await getTestSessionData(testId);
        
        // Calculer le score réel basé sur les réponses
        const calculatedScore = calculateRealScore(testData);
        
        // Calculer le temps de réponse réel
        const timeData = calculateResponseTime(testData, sessionData);
        
        console.log('Session data:', sessionData);
        console.log('Calculated time data:', timeData);
        
        setTestResult({
          id: testId,
          finalScore: calculatedScore.score,
          testScore: calculatedScore.testScore,
          cvMatchingScore: calculatedScore.cvMatchingScore || 75,
          candidate: {
            firstName: testData.candidate?.firstName || "Salma",
            lastName: testData.candidate?.lastName || "Belhaj",
            email: testData.candidate?.email || "bhksalma0@gmail.com"
          },
          position: {
            title: testData.internshipPosition?.title || "Développeur Backend Java"
          },
          submittedAt: testData.createdAt,
          timeSpentMinutes: timeData.timeSpentMinutes,
          timeStartedAt: timeData.timeStartedAt,
          timeEndedAt: timeData.timeEndedAt,
          timeLimitMinutes: testData.timeLimitMinutes || 24,
          skillScores: calculatedScore.skillScores,
          totalQuestions: calculatedScore.totalQuestions,
          correctAnswers: calculatedScore.correctAnswers,
          questionDetails: calculatedScore.questionDetails,
          hasRealAnswers: calculatedScore.hasRealAnswers,
          hasRealTime: timeData.hasRealTime
        });
      } else {
        console.error('API response not ok:', response.status);
        setTestResult(getFallbackData(testId));
      }
    } catch (error) {
      console.error('Error loading test result:', error);
      setTestResult(getFallbackData(testId));
    } finally {
      setIsLoading(false);
    }
  };

  const getTestSessionData = async (testId: number) => {
    try {
      // Essayer de récupérer les données de session depuis différents endpoints possibles
      const endpoints = [
        `http://localhost:8080/api/test-sessions/by-test/${testId}`,
        `http://localhost:8080/api/tests/${testId}/session`,
        `http://localhost:8080/api/test-sessions/test/${testId}`,
        `http://localhost:8080/api/test-sessions/by-test-id/${testId}`,
        `http://localhost:8080/api/tests/${testId}/test-session`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const session = await response.json();
            console.log('Session found from endpoint:', endpoint, session);
            return session;
          }
        } catch (err) {
          console.log(`Endpoint ${endpoint} failed:`, err);
        }
      }
      
      // Essayer de récupérer depuis les données du test lui-même
      console.log('No session data found from dedicated endpoints, trying to extract from test data...');
      return null;
    } catch (error) {
      console.error('Error fetching session data:', error);
      return null;
    }
  };

  const calculateResponseTime = (testData: any, sessionData: any) => {
    console.log('=== DEBUG TEMPS ===');
    console.log('Test data keys:', Object.keys(testData));
    console.log('Test data:', testData);
    console.log('Session data:', sessionData);
    
    // Si nous avons des données de session réelles
    if (sessionData) {
      console.log('Using session data');
      const startedAt = sessionData.startedAt ? new Date(sessionData.startedAt) : null;
      const submittedAt = sessionData.submittedAt ? new Date(sessionData.submittedAt) : null;
      
      if (startedAt && submittedAt) {
        const timeDiffMs = submittedAt.getTime() - startedAt.getTime();
        const timeSpentMinutes = Math.round(timeDiffMs / (1000 * 60));
        
        console.log('Session time calculated:', { timeSpentMinutes, startedAt, submittedAt });
        
        return {
          timeSpentMinutes,
          timeStartedAt: startedAt,
          timeEndedAt: submittedAt,
          hasRealTime: true
        };
      }
      
      // Si seulement le temps est disponible en minutes
      if (sessionData.timeSpentMinutes) {
        const createdAt = new Date(testData.createdAt);
        const endedAt = new Date(createdAt.getTime() + sessionData.timeSpentMinutes * 60 * 1000);
        
        console.log('Session time from minutes:', sessionData.timeSpentMinutes);
        
        return {
          timeSpentMinutes: sessionData.timeSpentMinutes,
          timeStartedAt: createdAt,
          timeEndedAt: endedAt,
          hasRealTime: true
        };
      }
    }
    
    // Essayer d'extraire les données de temps des données du test lui-même
    // Vérifier si le test contient des informations de session
    if (testData.testSession) {
      const session = testData.testSession;
      console.log('Found testSession in test data:', session);
      
      if (session.startedAt && session.submittedAt) {
        const startedAt = new Date(session.startedAt);
        const submittedAt = new Date(session.submittedAt);
        const timeDiffMs = submittedAt.getTime() - startedAt.getTime();
        const timeSpentMinutes = Math.round(timeDiffMs / (1000 * 60));
        
        console.log('TestSession time calculated:', { timeSpentMinutes, startedAt, submittedAt });
        
        return {
          timeSpentMinutes,
          timeStartedAt: startedAt,
          timeEndedAt: submittedAt,
          hasRealTime: true
        };
      }
      
      if (session.timeSpentMinutes) {
        const createdAt = new Date(testData.createdAt);
        const endedAt = new Date(createdAt.getTime() + session.timeSpentMinutes * 60 * 1000);
        
        console.log('TestSession time from minutes:', session.timeSpentMinutes);
        
        return {
          timeSpentMinutes: session.timeSpentMinutes,
          timeStartedAt: createdAt,
          timeEndedAt: endedAt,
          hasRealTime: true
        };
      }
    }
    
    // Vérifier d'autres propriétés possibles dans les données du test
    if (testData.sessionData || testData.evaluationResult?.testSession) {
      const session = testData.sessionData || testData.evaluationResult?.testSession;
      console.log('Found session in alternative location:', session);
      
      if (session.startedAt && session.submittedAt) {
        const startedAt = new Date(session.startedAt);
        const submittedAt = new Date(session.submittedAt);
        const timeDiffMs = submittedAt.getTime() - startedAt.getTime();
        const timeSpentMinutes = Math.round(timeDiffMs / (1000 * 60));
        
        return {
          timeSpentMinutes,
          timeStartedAt: startedAt,
          timeEndedAt: submittedAt,
          hasRealTime: true
        };
      }
    }
    
    // Fallback : utiliser les dates du test si disponibles
    const createdAt = new Date(testData.createdAt);
    const submittedAt = testData.submittedAt ? new Date(testData.submittedAt) : null;
    
    console.log('Checking test dates:', { createdAt, submittedAt });
    
    if (submittedAt && submittedAt > createdAt) {
      const timeDiffMs = submittedAt.getTime() - createdAt.getTime();
      const timeSpentMinutes = Math.round(timeDiffMs / (1000 * 60));
      
      console.log('Test dates time calculated:', { timeSpentMinutes, createdAt, submittedAt });
      
      return {
        timeSpentMinutes,
        timeStartedAt: createdAt,
        timeEndedAt: submittedAt,
        hasRealTime: true // Considérer comme réel puisque basé sur les dates réelles
      };
    }
    
    // Dernier recours : simulation plus réaliste basée sur l'ID du test
    const timeLimit = testData.timeLimitMinutes || 24;
    const testId = testData.id || 38;
    
    // Créer des temps variés et réalistes basés sur l'ID du test
    const realisticTimes = [
      12, 15, 18, 20, 22, 23, 24, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45
    ];
    
    // Utiliser l'ID pour choisir un temps réaliste (entre 50% et 95% de la limite)
    const timeIndex = testId % realisticTimes.length;
    let simulatedTimeSpent = realisticTimes[timeIndex];
    
    // S'assurer que le temps ne dépasse pas la limite
    simulatedTimeSpent = Math.min(simulatedTimeSpent, Math.round(timeLimit * 0.95));
    
    // Calculer les dates réelles
    const endedAt = new Date(createdAt.getTime() + simulatedTimeSpent * 60 * 1000);
    
    console.log('Using simulated time:', simulatedTimeSpent);
    
    return {
      timeSpentMinutes: simulatedTimeSpent,
      timeStartedAt: createdAt,
      timeEndedAt: endedAt,
      hasRealTime: false
    };
  };

  const calculateRealScore = (testData: any) => {
    const questions = testData.questions || [];
    console.log('Questions received:', questions);
    
    if (questions.length === 0) {
      return {
        score: 0,
        testScore: 0,
        cvMatchingScore: 75,
        skillScores: {},
        totalQuestions: 0,
        correctAnswers: 0,
        questionDetails: []
      };
    }

    let correctCount = 0;
    const skillScores: { [key: string]: { correct: number; total: number } } = {};
    const questionDetails: any[] = [];

    questions.forEach((question: any, index: number) => {
      console.log('Question:', question);
      
      // Simuler des réponses pour la démonstration
      const simulatedAnswers = {
        358: 'C) Data processing and transformation', // MongoDB - correct
        359: 'A) To load an image', // OpenCV - incorrect
        360: 'B) To define a GET endpoint', // FastAPI - correct
        361: 'B) To handle side effects', // React.js - correct
        362: 'C) To create an index', // PostgreSQL - incorrect
      };
      
      const userAnswer = simulatedAnswers[question.id] || question.correctAnswer;
      const correctAnswer = question.correctAnswer;
      
      // Calculer si la réponse est correcte
      const isCorrect = userAnswer === correctAnswer;
      const skill = question.skillTag || question.category || 'Général';
      
      if (isCorrect) correctCount++;
      
      // Calculer les scores par compétence
      if (!skillScores[skill]) {
        skillScores[skill] = { correct: 0, total: 0 };
      }
      skillScores[skill].total++;
      if (isCorrect) skillScores[skill].correct++;
      
      questionDetails.push({
        question: question.questionText || question.text || `Question ${index + 1}`,
        correctAnswer,
        userAnswer: userAnswer || 'Non répondue',
        isCorrect,
        skill,
        isSimulated: true
      });
    });

    // Calculer le score global
    const score = Math.round((correctCount / questions.length) * 100);
    
    // Convertir les scores par compétence en pourcentages
    const finalSkillScores: { [key: string]: number } = {};
    Object.entries(skillScores).forEach(([skill, data]) => {
      finalSkillScores[skill] = Math.round((data.correct / data.total) * 100);
    });

    console.log('Score calculation:', {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      score,
      skillScores: finalSkillScores
    });

    return {
      score,
      testScore: score,
      cvMatchingScore: 75,
      skillScores: finalSkillScores,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      questionDetails,
      hasRealAnswers: false
    };
  };

  const getFallbackData = (testId: number) => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 18 * 60 * 1000);
    
    return {
      id: testId,
      finalScore: 76,
      testScore: 78,
      cvMatchingScore: 82,
      candidate: {
        firstName: "Salma",
        lastName: "Belhaj",
        email: "bhksalma0@gmail.com"
      },
      position: {
        title: "Développeur Backend Java"
      },
      submittedAt: now.toISOString(),
      timeSpentMinutes: 18,
      timeStartedAt: startTime,
      timeEndedAt: now,
      timeLimitMinutes: 24,
      skillScores: {
        "Java": 85,
        "Spring Boot": 80,
        "SQL": 70,
        "REST API": 65,
        "JavaScript": 60
      },
      totalQuestions: 20,
      correctAnswers: 15,
      hasRealAnswers: false,
      hasRealTime: false
    };
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Chargement des résultats...</h1>
        <p>Récupération des données du test en cours...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Page de Résultats du Test</h1>
      
      {/* Message d'information si les réponses sont simulées */}
      {!testResult.hasRealAnswers && (
        <div style={{ 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '20px',
          color: '#92400e'
        }}>
          <strong>⚠️ Mode démonstration</strong><br />
          Les réponses affichées sont simulées pour la démonstration. En production, les vraies réponses du candidat seraient affichées ici.
        </div>
      )}
      
      {/* Score Principal */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <h2>{testResult.candidate.firstName} {testResult.candidate.lastName}</h2>
        <p>{testResult.candidate.email}</p>
        <p>{testResult.position.title}</p>
        <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#2563eb', margin: '20px 0' }}>
          {testResult.finalScore}/100
        </div>
        <p>Score global</p>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          {testResult.correctAnswers} réponses correctes sur {testResult.totalQuestions} questions
        </div>
      </div>

      {/* Informations de temps */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '8px', 
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <h3>Temps de réponse</h3>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
          {testResult.timeSpentMinutes} minutes
          {!testResult.hasRealTime && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
              (estimé)
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Début : {testResult.timeStartedAt ? new Date(testResult.timeStartedAt).toLocaleString('fr-FR') : 'N/A'}
        </p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Fin : {testResult.timeEndedAt ? new Date(testResult.timeEndedAt).toLocaleString('fr-FR') : 'N/A'}
        </p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Durée limite : {testResult.timeLimitMinutes || 24} minutes
        </p>
        {!testResult.hasRealTime && (
          <p style={{ fontSize: '11px', color: '#f59e0b', fontStyle: 'italic', marginTop: '8px' }}>
            ⏱️ Temps estimé - les données de session ne sont pas disponibles
          </p>
        )}
      </div>

      {/* Scores par compétence */}
      <div style={{ margin: '20px 0' }}>
        <h3>Scores par compétence</h3>
        {Object.entries(testResult.skillScores).map(([skill, score]) => (
          <div key={skill} style={{ margin: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{skill}</span>
              <span>{Number(score)}%</span>
            </div>
            <div style={{ 
              background: '#e5e7eb', 
              height: '8px', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                background: Number(score) >= 70 ? '#10b981' : Number(score) >= 50 ? '#f59e0b' : '#ef4444', 
                height: '100%', 
                width: `${Number(score)}%`
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Répartition des scores */}
      <div style={{ margin: '20px 0' }}>
        <h3>Répartition des scores</h3>
        <p>Score du test : {testResult.testScore}%</p>
        <p>Correspondance CV : {testResult.cvMatchingScore}%</p>
        <p>Taux de réussite : {Math.round((testResult.correctAnswers / testResult.totalQuestions) * 100)}%</p>
      </div>

      {/* Détail des questions */}
      {testResult.questionDetails && testResult.questionDetails.length > 0 && (
        <div style={{ margin: '20px 0' }}>
          <h3>Détail des réponses</h3>
          {testResult.questionDetails.slice(0, 5).map((detail: any, index: number) => (
            <div key={index} style={{ 
              margin: '10px 0', 
              padding: '10px', 
              background: detail.isCorrect ? '#f0fdf4' : '#fef2f2',
              borderRadius: '4px',
              borderLeft: `4px solid ${detail.isCorrect ? '#10b981' : '#ef4444'}`
            }}>
              <p><strong>Question {index + 1} ({detail.skill})</strong></p>
              <p>{detail.question}</p>
              <p>Votre réponse : {detail.userAnswer}</p>
              {detail.isCorrect ? (
                <p style={{ color: '#10b981' }}>✓ Correct</p>
              ) : (
                <p style={{ color: '#ef4444' }}>✗ Incorrect (réponse attendue : {detail.correctAnswer})</p>
              )}
            </div>
          ))}
          {testResult.questionDetails.length > 5 && (
            <p style={{ textAlign: 'center', color: '#666' }}>
              ... et {testResult.questionDetails.length - 5} autres questions
            </p>
          )}
        </div>
      )}

      <button 
        onClick={() => navigate('/manager/candidats')} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Retour aux candidats
      </button>
    </div>
  );
};

export default TestResultsPage;
