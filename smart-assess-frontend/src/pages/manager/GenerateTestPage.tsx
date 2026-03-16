import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Check, AlertCircle } from "lucide-react";

const skills = [
  { name: "Java", level: "Avancé" },
  { name: "Spring Boot", level: "Avancé" },
  { name: "PostgreSQL", level: "Inter." },
  { name: "REST API", level: "Inter." },
  { name: "Git", level: "Inter." },
  { name: "Docker", level: "Débutant" },
];

const eligibility = [
  { label: 'Domaine détecté : Génie Logiciel — accepté pour ce poste', ok: true },
  { label: 'Score qualité CV : 8/10 — supérieur au minimum requis (6/10)', ok: true },
  { label: 'Signal IA : PROMISING — candidature retenue', ok: true },
  { label: 'Compétences requises : Java ✓ Spring Boot ✓ SQL ✓', ok: true },
];

const GenerateTestPage = () => {
  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Décision — Génération du test</h1>
          <p className="text-sm text-muted-foreground mt-1">Candidature #57 · Salma Ben Khalifa · Dev Backend Java</p>
        </div>
        <Badge variant="outline" className="text-warning border-warning/50">En attente de décision</Badge>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Candidate Profile */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">Profil candidat</Badge>
              <Badge variant="outline">Génie Logiciel</Badge>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">SB</div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Salma Ben Khalifa</h2>
                <p className="text-sm text-muted-foreground">salma.bk@esprit.tn · +216 55 987 654</p>
                <p className="text-xs text-muted-foreground">3ème année Génie Logiciel · ESPRIT</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="text-center glass-card p-2">
                <div className="text-sm font-bold text-primary">JUNIOR</div>
                <div className="text-xs text-muted-foreground">Niveau détecté</div>
              </div>
              <div className="text-center glass-card p-2">
                <div className="text-sm font-bold text-success">PROMISING</div>
                <div className="text-xs text-muted-foreground">Signal IA</div>
              </div>
              <div className="text-center glass-card p-2">
                <div className="text-sm font-bold text-primary">8/10</div>
                <div className="text-xs text-muted-foreground">Score qualité CV</div>
              </div>
              <div className="text-center glass-card p-2">
                <div className="text-sm font-bold text-foreground">0–1 an</div>
                <div className="text-xs text-muted-foreground">Expérience</div>
              </div>
            </div>

            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Analyse IA du CV</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Salma est étudiante en 3ème année Génie Logiciel à l'ESPRIT. Son CV présente une bonne maîtrise de <strong>Java</strong> et <strong>Spring Boot</strong> validée sur un projet de gestion RH. Connaissances en <strong>SQL</strong> (PostgreSQL) et <strong>REST API</strong> documentées. Niveau JUNIOR confirmé.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Compétences détectées</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s.name} variant="secondary" className="text-xs">{s.name} · {s.level}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Vérification d'éligibilité</h3>
            <div className="space-y-2 mb-4">
              {eligibility.map((e) => (
                <div key={e.label} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{e.label}</span>
                </div>
              ))}
            </div>
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
              <Badge className="bg-success text-success-foreground mb-1">Candidat ÉLIGIBLE</Badge>
              <p className="text-xs text-muted-foreground">Tous les critères sont satisfaits</p>
            </div>
          </div>
        </div>

        {/* Right: Test Config */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Configuration du test à générer</h2>

            <div className="space-y-2">
              <Label>Poste ciblé</Label>
              <Input value="Développeur Backend Java" readOnly className="bg-muted/30" />
            </div>

            <div className="space-y-2">
              <Label>Niveau du test</Label>
              <Select defaultValue="junior">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">JUNIOR (recommandé par IA)</SelectItem>
                  <SelectItem value="mid">MID</SelectItem>
                  <SelectItem value="senior">SENIOR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compétences testées</Label>
              <div className="flex flex-wrap gap-2">
                {["Java", "Spring Boot", "SQL", "REST API", "Docker"].map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre de questions</Label>
              <Input type="number" defaultValue={20} />
              <p className="text-xs text-muted-foreground">(défaut : 20)</p>
            </div>

            <div className="space-y-2">
              <Label>Durée du test</Label>
              <Select defaultValue="60">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date limite de passage</Label>
              <Input type="date" />
            </div>

            <div className="space-y-2">
              <Label>Note au candidat (optionnelle)</Label>
              <Textarea placeholder="Message personnalisé..." rows={2} />
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Décision du Manager</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cette action génèrera le test via l'IA et enverra le lien sécurisé par email au candidat.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1">Accepter et générer le test</Button>
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">Refuser</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              Le test sera généré automatiquement par le service IA. Un lien d'accès unique sera envoyé à <strong>salma.bk@esprit.tn</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateTestPage;
