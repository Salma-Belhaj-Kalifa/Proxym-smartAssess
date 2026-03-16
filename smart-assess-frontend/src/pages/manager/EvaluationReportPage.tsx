import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, GitCompare, Check, X, Sparkles } from "lucide-react";

const competences = [
  { name: "Spring Boot", score: 85 },
  { name: "Java", score: 80 },
  { name: "SQL", score: 70 },
  { name: "REST API", score: 65 },
];

const strengths = ["Architecture Spring Boot", "Composants Java avancés", "Requêtes SQL standard", "Initiative personnelle (VPS)"];
const improvements = ["REST API — gestion erreurs", "Index et optimisation SQL", "Tests unitaires JUnit", "Spring Security"];

const EvaluationReportPage = () => {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rapport d'évaluation</h1>
          <p className="text-sm text-muted-foreground mt-1">Généré automatiquement · 3 mars 2026 à 14h32</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exporter PDF</Button>
          <Button variant="outline" size="sm"><GitCompare className="w-4 h-4 mr-2" />Comparer candidats</Button>
        </div>
      </div>

      {/* Candidate Header */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">WO</div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">Wala Oueslati</h2>
          <p className="text-sm text-muted-foreground">wala.oueslati@gmail.com</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">Dev Backend Java</Badge>
            <Badge variant="secondary">Niveau : MID</Badge>
          </div>
        </div>
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">76</div>
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
          <strong>Wala</strong> démontre une solide maîtrise de <strong>Spring Boot</strong> (85%) avec une bonne compréhension de l'architecture REST. Sa connaissance de <strong>Java</strong> est bonne (80%). En <strong>SQL</strong>, elle maîtrise les requêtes de base mais montre des faiblesses sur les index. <strong>REST API</strong> reste à approfondir (65%). Cohérence CV / Test : <strong>bonne</strong> — aucune incohérence majeure détectée.
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
