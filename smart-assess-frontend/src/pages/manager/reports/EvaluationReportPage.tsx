import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, GitCompare, Check, X, Sparkles, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

// Mock data détaillé pour chaque candidat
const mockResults = {
  1: {
    candidate: {
      name: "Wala Oueslati",
      email: "wala.oueslati@gmail.com",
      initials: "WO"
    },
    position: "Développeur Backend Java",
    company: "Proxym IT",
    globalScore: 76,
    evaluationDate: "2026-03-18T14:32:00Z",
    status: "completed",
    competences: [
      { name: "Spring Boot", score: 85 },
      { name: "Java", score: 80 },
      { name: "SQL", score: 70 },
      { name: "REST API", score: 65 },
    ],
    strengths: ["Architecture Spring Boot", "Composants Java avancés", "Requêtes SQL standard", "Initiative personnelle (VPS)"],
    improvements: ["REST API — gestion erreurs", "Index et optimisation SQL", "Tests unitaires JUnit", "Spring Security"],
    aiAnalysis: "Wala démontre une solide maîtrise de Spring Boot (85%) avec une bonne compréhension de l'architecture REST. Sa connaissance de Java est bonne (80%). En SQL, elle maîtrise les requêtes de base mais montre des faiblesses sur les index. REST API reste à approfondir (65%). Cohérence CV / Test : bonne — aucune incohérence majeure détectée."
  },
  2: {
    candidate: {
      name: "Salma Belhaj",
      email: "bhksalma0@gmail.com",
      initials: "SB"
    },
    position: "Développeur Frontend React",
    company: "Proxym IT",
    globalScore: 82,
    evaluationDate: "2026-03-17T16:45:00Z",
    status: "completed",
    competences: [
      { name: "React", score: 90 },
      { name: "TypeScript", score: 85 },
      { name: "CSS/Tailwind", score: 80 },
      { name: "State Management", score: 75 },
    ],
    strengths: ["Composants React avancés", "TypeScript strict", "Design responsive", "Performance optimisation"],
    improvements: ["Tests unitaires Jest", "Accessibility (WCAG)", "Server-side rendering", "Advanced patterns"],
    aiAnalysis: "Salma montre une excellente maîtrise de React (90%) avec des pratiques modernes. TypeScript est bien utilisé (85%). Le design responsive est de qualité. Points à améliorer : tests unitaires et accessibilité. Très bonne cohérence entre CV et résultats pratiques."
  },
  3: {
    candidate: {
      name: "Mohamed Ali",
      email: "mohamed.ali@email.com",
      initials: "MA"
    },
    position: "DevOps Engineer",
    company: "Proxym IT",
    globalScore: 68,
    evaluationDate: "2026-03-16T11:20:00Z",
    status: "completed",
    competences: [
      { name: "Docker", score: 75 },
      { name: "Kubernetes", score: 70 },
      { name: "CI/CD", score: 72 },
      { name: "AWS", score: 65 },
    ],
    strengths: ["Configuration Docker", "Scripts CI/CD", "Monitoring basique", "Infrastructure as code"],
    improvements: ["Kubernetes avancé", "Security best practices", "Cost optimisation", "Multi-cloud strategies"],
    aiAnalysis: "Mohamed a de bonnes bases en DevOps (68%). Docker est bien maîtrisé (75%). CI/CD est fonctionnel. Kubernetes nécessite plus de pratique. AWS basics sont présents mais manque d'expérience en production. Bon potentiel d'apprentissage."
  },
  4: {
    candidate: {
      name: "Sarra Kallel",
      email: "sarra.kallel@email.com",
      initials: "SK"
    },
    position: "Data Scientist",
    company: "Proxym IT",
    globalScore: 91,
    evaluationDate: "2026-03-15T09:15:00Z",
    status: "completed",
    competences: [
      { name: "Python", score: 95 },
      { name: "Machine Learning", score: 92 },
      { name: "TensorFlow", score: 88 },
      { name: "Data Visualization", score: 85 },
    ],
    strengths: ["Modèles ML avancés", "Analyse statistique", "Deep learning", "Data storytelling"],
    improvements: ["Big data technologies", "Real-time processing", "ML deployment", "Cloud ML services"],
    aiAnalysis: "Sarra démontre une expertise exceptionnelle en data science (91%). Python et ML sont excellents. TensorFlow est bien maîtrisé. Visualisation de données est claire et efficace. Profil de niveau senior avec fort potentiel d'innovation."
  },
  5: {
    candidate: {
      name: "Youssef Ben",
      email: "youssef.ben@email.com",
      initials: "YB"
    },
    position: "Mobile Developer",
    company: "Proxym IT",
    globalScore: 74,
    evaluationDate: "2026-03-14T13:30:00Z",
    status: "in_progress",
    competences: [
      { name: "React Native", score: 78 },
      { name: "Flutter", score: 72 },
      { name: "iOS", score: 70 },
      { name: "Android", score: 68 },
    ],
    strengths: ["React Native", "State Management", "UI/UX design", "App performance"],
    improvements: ["Native modules", "Advanced animations", "Background processing", "App store deployment"],
    aiAnalysis: "Youssef a de bonnes compétences en mobile (74%). React Native est bien maîtrisé. Flutter est fonctionnel. Bon sens du design UX. Points à améliorer : optimisation performance et déploiement en production. Évaluation en cours."
  }
};

// Types pour les données d'évaluation
interface EvaluationReport {
  candidate_summary: {
    name: string;
    email: string;
    experience_level: string;
    years_of_experience: number;
    primary_domain: string;
    key_technologies: string[];
  };
  technical_assessment: {
    overall_score: number;
    skill_breakdown: {
      skill: string;
      score: number;
      mastery_level: string;
      assessment: string;
    }[];
    strengths: string[];
    improvement_areas: string[];
  };
  position_analysis: {
    applied_position_match: number;
    recommended_positions: {
      position: string;
      match_score: number;
      reasoning: string;
    }[];
    alternative_positions: {
      position: string;
      match_score: number;
      reasoning: string;
    }[];
  };
  hiring_recommendation: {
    recommendation: string;
    confidence_score: number;
    key_factors: string[];
    potential_risks: string[];
    next_steps: string[];
  };
  team_fit_analysis: {
    collaboration_score: number;
    leadership_potential: string;
    adaptability_score: number;
    cultural_fit_indicators: string[];
  };
}

const EvaluationReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const candidatureId = id ? parseInt(id) : null;

  useEffect(() => {
    if (!candidatureId) {
      setError("ID de candidature non valide");
      setLoading(false);
      return;
    }

    const fetchEvaluationReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.post(`/v1/evaluation/generate-report/${candidatureId}`);
        
        if (response.data) {
          setEvaluationReport(response.data);
        } else {
          setError("Aucune donnée d'évaluation disponible");
        }
      } catch (err: any) {
        console.error("Error fetching evaluation report:", err);
        setError(err.response?.data?.error || "Erreur lors du chargement du rapport d'évaluation");
        toast({
          title: "Erreur",
          description: err.response?.data?.error || "Impossible de charger le rapport d'évaluation",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluationReport();
  }, [candidatureId, toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'strong hire':
      case 'strongly recommend':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'hire':
      case 'recommend':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'consider':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'reject':
      case 'not recommended':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRecommendationLabel = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'strong hire':
      case 'strongly recommend':
        return 'Fortement recommandé';
      case 'hire':
      case 'recommend':
        return 'Recommandé';
      case 'consider':
        return 'À considérer';
      case 'reject':
      case 'not recommended':
        return 'Non recommandé';
      default:
        return recommendation;
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Génération du rapport d'évaluation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluationReport) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-4">{error || "Aucune donnée disponible"}</p>
            <Button onClick={() => navigate("/manager/applications")}>
              Retour aux candidatures
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { candidate_summary, technical_assessment, position_analysis, hiring_recommendation, team_fit_analysis } = evaluationReport;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/manager/applications">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux candidatures
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Rapport d'évaluation IA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Généré automatiquement · {formatDate(new Date().toISOString())}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
          <Button variant="outline" size="sm">
            <GitCompare className="w-4 h-4 mr-2" />
            Comparer candidats
          </Button>
        </div>
      </div>

      {/* Candidate Header */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
          {candidate_summary.name.split(' ').map(n => n[0]).join('').toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{candidate_summary.name}</h2>
          <p className="text-sm text-muted-foreground">{candidate_summary.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{candidate_summary.experience_level}</Badge>
            <Badge variant="secondary">{candidate_summary.primary_domain}</Badge>
            <Badge variant="outline">{candidate_summary.years_of_experience} ans d'expérience</Badge>
          </div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{Math.round(technical_assessment.overall_score)}</div>
          <div className="text-sm text-muted-foreground">/100</div>
          <p className="text-xs text-muted-foreground mt-1">Score global d'évaluation</p>
        </div>
      </div>

      {/* Technical Assessment */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Évaluation technique</h3>
        <div className="space-y-4">
          {technical_assessment.skill_breakdown.map((skill) => (
            <div key={skill.skill} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{skill.skill}</span>
                <span className="text-primary font-medium">{Math.round(skill.score)}%</span>
              </div>
              <Progress value={skill.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{skill.assessment}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Position Analysis */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Analyse de positionnement</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">Postes recommandés</h4>
            <div className="space-y-2">
              {position_analysis.recommended_positions.map((pos, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{pos.position}</p>
                    <p className="text-sm text-muted-foreground">{pos.reasoning}</p>
                  </div>
                  <Badge variant="outline">{Math.round(pos.match_score)}%</Badge>
                </div>
              ))}
            </div>
          </div>
          
          {position_analysis.alternative_positions.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Alternatives</h4>
              <div className="space-y-2">
                {position_analysis.alternative_positions.map((pos, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{pos.position}</p>
                      <p className="text-sm text-muted-foreground">{pos.reasoning}</p>
                    </div>
                    <Badge variant="secondary">{Math.round(pos.match_score)}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Points forts</h3>
          <ul className="space-y-3">
            {technical_assessment.strengths.map((strength, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-success" />
                </div>
                {strength}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Axes d'amélioration</h3>
          <ul className="space-y-3">
            {technical_assessment.improvement_areas.map((area, index) => (
              <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-warning" />
                </div>
                {area}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Team Fit Analysis */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Adéquation équipe</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(team_fit_analysis.collaboration_score)}%</div>
            <p className="text-sm text-muted-foreground">Collaboration</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Math.round(team_fit_analysis.adaptability_score)}%</div>
            <p className="text-sm text-muted-foreground">Adaptabilité</p>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="mb-2">{team_fit_analysis.leadership_potential}</Badge>
            <p className="text-sm text-muted-foreground">Potentiel de leadership</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Indicateurs culturels: {team_fit_analysis.cultural_fit_indicators.join(', ')}
          </p>
        </div>
      </div>

      {/* Hiring Recommendation */}
      <div className="glass-card p-6 border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recommandation d'embauche</h3>
        </div>
        <div className="space-y-3">
          <Badge className={getRecommendationColor(hiring_recommendation.recommendation)}>
            {getRecommendationLabel(hiring_recommendation.recommendation)}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Confiance: {Math.round(hiring_recommendation.confidence_score)}%
          </p>
          <div>
            <h4 className="font-medium text-foreground mb-2">Facteurs clés:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {hiring_recommendation.key_factors.map((factor, index) => (
                <li key={index}>- {factor}</li>
              ))}
            </ul>
          </div>
          {hiring_recommendation.potential_risks.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Risques potentiels:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {hiring_recommendation.potential_risks.map((risk, index) => (
                  <li key={index}>- {risk}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 className="font-medium text-foreground mb-2">Prochaines étapes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {hiring_recommendation.next_steps.map((step, index) => (
                <li key={index}>{index + 1}. {step}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationReportPage;
