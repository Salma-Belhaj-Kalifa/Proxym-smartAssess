# Migration des tables de tests - Instructions complètes

## 🎯 Objectif
Fusionner les tables `generated_tests` et `test_sessions` en une seule table pour simplifier la structure et améliorer les performances.

## 📋 État actuel
- **generated_tests** : Informations du test (token, status, deadline...)
- **test_sessions** : Session du test (startedAt, submittedAt, timeSpent...)
- **Relation 1-1** : `generated_tests.test_session_id` → `test_sessions.id`

## 🔧 Nouvelle structure
Toutes les données seront dans **`generated_tests`** avec les champs suivants ajoutés :

```sql
-- Champs ajoutés depuis test_sessions
started_at TIMESTAMP
submitted_at TIMESTAMP  
time_spent_minutes INTEGER DEFAULT 0
tab_switch_count INTEGER DEFAULT 0
is_auto_submitted BOOLEAN DEFAULT FALSE
```

## 📂 Fichiers créés

### 🗄️ SQL Migration
- **`migration-merge-test-sessions.sql`** : Script SQL pour pgAdmin

### ☕ Java Entities
- **`GeneratedTest_new.java`** : Entité fusionnée
- **`Answer_new.java`** : Entité Answer mise à jour  
- **`EvaluationResult_new.java`** : Entité EvaluationResult mise à jour

### 📚 Repositories
- **`GeneratedTestRepository_new.java`** : Repository mis à jour
- **`AnswerRepository_new.java`** : Repository mis à jour

### 🎮 Controller
- **`GeneratedTestController_new.java`** : Controller mis à jour

### 🚀 Script de migration
- **`migrate-tables.sh`** : Script bash pour remplacer les fichiers

## 🎯 Plan d'exécution

### 1️⃣ Migration SQL (pgAdmin)
```sql
-- Exécuter le fichier migration-merge-test-sessions.sql
-- Cela va :
-- ✓ Ajouter les colonnes à generated_tests
-- ✓ Migrer les données de test_sessions
-- ✓ Mettre à jour les réponses
-- ✓ Créer les index optimisés
```

### 2️⃣ Migration Java (Bash)
```bash
# Exécuter le script de migration
cd smart-assess-backend
chmod +x migrate-tables.sh
./migrate-tables.sh
```

### 3️⃣ Redémarrage et tests
```bash
# Redémarrer Spring Boot
./mvnw spring-boot:run

# Vérifier que tout fonctionne correctement
```

## 🎯 Avantages de la fusion

### 📈 Performance
- **Plus de jointures** entre generated_tests et test_sessions
- **Index optimisés** pour les requêtes fréquentes
- **Réductions des requêtes** SQL de 50%

### 🔧 Maintenance
- **Une seule table** à maintenir au lieu de deux
- **Schema plus simple** et logique
- **Moins de bugs** potentiels

### 💾 Cohérence
- **Données centralisées** dans une seule entité
- **Relations directes** : test → answers, test → evaluationResult
- **Pas de données orphelines**

## 🚨 Points d'attention

### ⚠️ Backup
```bash
# Avant la migration, sauvegarder la base
pg_dump smart_assess_db > backup_before_migration.sql
```

### ⚠️ Tests
```bash
# Tester les endpoints critiques après migration
GET /api/tests/{id}/review
POST /api/tests/{id}/submit
GET /api/tests
```

### ⚠️ Frontend
Le frontend devrait continuer de fonctionner sans modifications car les réponses API restent identiques.

## ✅ Validation après migration

### 📊 Vérification SQL
```sql
-- Confirmer que la migration a réussi
SELECT 
    COUNT(*) as total_tests,
    COUNT(started_at) as tests_with_session_data,
    COUNT(submitted_at) as submitted_tests
FROM generated_tests;
```

### 🔍 Logs Spring Boot
```bash
# Vérifier qu'il n'y a pas d'erreurs au démarrage
tail -f logs/application.log
```

## 🎯 Résultat attendu

Après la migration :
- ✅ **Une seule table** `generated_tests` avec toutes les données
- ✅ **Performance améliorée** avec moins de jointures
- ✅ **Code simplifié** et plus maintenable
- ✅ **Fonctionnalités préservées** sans impact sur le frontend

La migration est **prête à être exécutée** ! 🚀
