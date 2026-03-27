import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Pencil, Trash2, Plus, Check, X } from "lucide-react";

const summaryStats = [
  { value: "20", label: "Questions générées" },
  { value: "8", label: "Spring Boot" },
  { value: "5", label: "Java" },
  { value: "4", label: "SQL" },
  { value: "3", label: "REST API" },
];

const typeStats = [
  { value: "14", label: "MCQ" },
  { value: "4", label: "Texte court" },
  { value: "2", label: "Ouverte" },
];

interface Question {
  id: number;
  topic: string;
  difficulty: string;
  type: string;
  points: string;
  text: string;
  status: "validated" | "editing" | "deleted";
  options?: { id: string; text: string; correct?: boolean }[];
  freeText?: string;
  deleteReason?: string;
}

const initialQuestions: Question[] = [
  {
    id: 1, topic: "Spring Boot", difficulty: "Inter.", type: "MCQ", points: "1 pt",
    text: "Quelle annotation Spring Boot est utilisée pour marquer une classe contenant la logique métier de l'application ?",
    status: "validated",
    options: [
      { id: "A", text: "`@Repository`" },
      { id: "B", text: "`@Controller`" },
      { id: "C", text: "`@Service`", correct: true },
      { id: "D", text: "`@Component`" },
    ],
  },
  {
    id: 2, topic: "Java", difficulty: "Débutant", type: "MCQ", points: "1 pt",
    text: "Quelle est la différence entre == et .equals() en Java ?",
    status: "editing",
    options: [
      { id: "A", text: "Option A" },
      { id: "B", text: "Option B (correcte)", correct: true },
      { id: "C", text: "Option C" },
      { id: "D", text: "Option D" },
    ],
  },
  {
    id: 3, topic: "SQL", difficulty: "Inter.", type: "MCQ", points: "1 pt",
    text: "Quelle clause SQL est utilisée pour filtrer les résultats d'une agrégation GROUP BY ?",
    status: "validated",
    options: [
      { id: "A", text: "`WHERE`" },
      { id: "B", text: "`HAVING`", correct: true },
      { id: "C", text: "`FILTER`" },
      { id: "D", text: "`ORDER BY`" },
    ],
  },
  {
    id: 4, topic: "Spring Boot", difficulty: "Avancé", type: "Texte court", points: "2 pts",
    text: "Expliquez en 2-3 phrases la différence entre `@RestController` et `@Controller` dans Spring Boot.",
    status: "validated",
    freeText: "Réponse texte libre — évaluée par l'IA",
  },
  {
    id: 5, topic: "REST API", difficulty: "MCQ", type: "MCQ", points: "1 pt",
    text: "Quel code HTTP correspond à une ressource non trouvée ?",
    status: "deleted",
    deleteReason: "Question jugée trop basique pour le niveau JUNIOR",
  },
  {
    id: 6, topic: "Spring Boot", difficulty: "Avancé", type: "Ouverte", points: "3 pts",
    text: "Décrivez comment vous implémenteriez une API REST sécurisée avec Spring Boot permettant à un utilisateur de s'authentifier et d'accéder à des ressources protégées.",
    status: "validated",
    freeText: "Réponse longue — évaluée par l'IA avec rubrique",
  },
];

const QuestionValidationPage = () => {
  const [questions] = useState(initialQuestions);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Révision des questions</h1>
          <p className="text-sm text-muted-foreground mt-1">Test généré par IA · Salma Ben Khalifa · Dev Backend Java · JUNIOR</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2 text-sm">
            <span className="text-success">17 validées</span>·
            <span className="text-warning">2 modifiées</span>·
            <span className="text-destructive">1 supprimée</span>
          </div>
          <Button>
            <Send className="w-4 h-4 mr-2" />
            Envoyer le test au candidat
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {summaryStats.map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-primary">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {typeStats.map((s) => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Toutes (20)</TabsTrigger>
            <TabsTrigger value="spring">Spring Boot (8)</TabsTrigger>
            <TabsTrigger value="java">Java (5)</TabsTrigger>
            <TabsTrigger value="sql">SQL (4)</TabsTrigger>
            <TabsTrigger value="rest">REST API (3)</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter une question
          </Button>
        </div>

        <TabsContent value="all" className="space-y-4 mt-4">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
          <div className="glass-card p-4 text-center text-sm text-muted-foreground">
            + 14 autres questions · Faites défiler pour les voir
          </div>
        </TabsContent>
      </Tabs>

      {/* Ready */}
      <div className="glass-card p-4 border-success/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          <span className="text-sm font-medium text-foreground">Prêt à envoyer</span>
          <span className="text-sm text-muted-foreground">19 questions validées · 60 minutes · Lien sécurisé par email</span>
        </div>
        <Button>
          <Send className="w-4 h-4 mr-2" />
          Envoyer
        </Button>
      </div>
    </div>
  );
};

const QuestionCard = ({ question }: { question: Question }) => {
  if (question.status === "deleted") {
    return (
      <div className="glass-card p-5 opacity-50 border-destructive/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">Q{question.id}</span>
            <Badge variant="outline" className="text-xs">{question.topic}</Badge>
            <Badge variant="destructive" className="text-xs">Supprimée</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-through">{question.text}</p>
        <p className="text-xs text-destructive mt-1">{question.deleteReason}</p>
      </div>
    );
  }

  if (question.status === "editing") {
    return (
      <div className="glass-card p-5 border-warning/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Q{question.id}</span>
            <Badge variant="outline" className="text-xs">{question.topic}</Badge>
            <Badge variant="outline" className="text-xs">{question.difficulty}</Badge>
            <Badge variant="outline" className="text-xs">{question.type}</Badge>
            <Badge variant="outline" className="text-xs">{question.points}</Badge>
            <Badge className="bg-warning/20 text-warning text-xs">Modifiée</Badge>
          </div>
        </div>
        <div className="space-y-3">
          <Textarea defaultValue={question.text} className="text-sm" rows={2} />
          {question.options?.map((o) => (
            <Input key={o.id} defaultValue={`${o.text}${o.correct ? " (correcte)" : ""}`} className="text-sm" />
          ))}
          <div className="flex gap-2">
            <Button size="sm">Sauvegarder</Button>
            <Button size="sm" variant="outline">Annuler</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Q{question.id}</span>
          <Badge variant="outline" className="text-xs">{question.topic}</Badge>
          <Badge variant="outline" className="text-xs">{question.difficulty}</Badge>
          <Badge variant="outline" className="text-xs">{question.type}</Badge>
          <Badge variant="outline" className="text-xs">{question.points}</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      <p className="text-sm text-foreground mb-3">{question.text}</p>
      {question.options && (
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((o) => (
            <div key={o.id} className={`text-sm px-3 py-2 rounded-lg ${o.correct ? "bg-success/10 text-success font-medium" : "bg-muted/50 text-muted-foreground"}`}>
              <span className="font-bold mr-2">{o.id}</span>{o.text}
            </div>
          ))}
        </div>
      )}
      {question.freeText && (
        <div className="bg-muted/30 rounded-lg px-3 py-2 text-sm text-muted-foreground italic">
          {question.freeText}
        </div>
      )}
    </div>
  );
};

export default QuestionValidationPage;
