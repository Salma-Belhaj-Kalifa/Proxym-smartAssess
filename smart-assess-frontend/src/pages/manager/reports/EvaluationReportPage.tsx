import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, GitCompare, Check, X, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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

const EvaluationReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const resultId = id ? parseInt(id) : 1;
  
  // Récupérer les données du candidat ou utiliser un fallback
  const result = mockResults[resultId as keyof typeof mockResults] || mockResults[1];
  
  const { candidate, position, company, globalScore, evaluationDate, competences, strengths, improvements, aiAnalysis } = result;

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

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/manager/resultats">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Rapport d'évaluation IA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Généré automatiquement · {formatDate(evaluationDate)}
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
          {candidate.initials}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{candidate.name}</h2>
          <p className="text-sm text-muted-foreground">{candidate.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{position}</Badge>
            <Badge variant="secondary">{company}</Badge>
          </div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">{globalScore}</div>
          <div className="text-sm text-muted-foreground">/100</div>
          <p className="text-xs text-muted-foreground mt-1">Score global d'évaluation</p>
        </div>
      </div>

      {/* Scores */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Scores par compétence</h3>
        <div className="space-y-4">
          {competences.map((c) => (
            <div key={c.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{c.name}</span>
                <span className="text-primary font-medium">{c.score}%</span>
              </div>
              <Progress value={c.score} className="h-2" />
            </div>
          ))}
        </div>
      </div>

      {/* AI Report */}
      <div className="glass-card p-6 border-primary/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Rapport analytique IA</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {aiAnalysis}
        </p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Points forts</h3>
          <ul className="space-y-3">
            {strengths.map((s) => (
              <li key={s} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-success" />
                </div>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Axes d'amélioration</h3>
          <ul className="space-y-3">
            {improvements.map((s) => (
              <li key={s} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-warning" />
                </div>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendation */}
      <div className="glass-card p-6 border-success/30">
        <h3 className="text-lg font-semibold text-foreground mb-2">Recommandation</h3>
        <Badge className="bg-success/20 text-success mb-3">Recommandation automatique</Badge>
        <p className="text-sm text-muted-foreground mb-4">
          Profil MID solide — recommandé pour le stage Dev Backend Java. Score suffisant pour convoquer en entretien final.
        </p>
        <div className="flex gap-3">
          <Button className="bg-success hover:bg-success/90 text-success-foreground">Accepter la candidature</Button>
          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">Refuser</Button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationReportPage;
