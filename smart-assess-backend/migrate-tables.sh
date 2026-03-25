#!/bin/bash

# Script de migration pour fusionner les tables generated_tests et test_sessions
# À exécuter après avoir appliqué la SQL migration

echo "🔄 Migration des tables de tests..."

# 1. Sauvegarder les anciens fichiers
echo "📦 Sauvegarde des anciens fichiers..."
cd src/main/java/com/example/smart_assess/entity
mv GeneratedTest.java GeneratedTest_old.java
mv TestSession.java TestSession_old.java
mv Answer.java Answer_old.java
mv EvaluationResult.java EvaluationResult_old.java

cd ../repository
mv GeneratedTestRepository.java GeneratedTestRepository_old.java
mv TestSessionRepository.java TestSessionRepository_old.java
mv AnswerRepository.java AnswerRepository_old.java

cd ../controller
mv GeneratedTestController.java GeneratedTestController_old.java

# 2. Remplacer par les nouveaux fichiers
echo "🔄 Remplacement par les nouveaux fichiers..."
cd ../entity
mv GeneratedTest_new.java GeneratedTest.java
mv Answer_new.java Answer.java
mv EvaluationResult_new.java EvaluationResult.java

cd ../repository
mv GeneratedTestRepository_new.java GeneratedTestRepository.java
mv AnswerRepository_new.java AnswerRepository.java

cd ../controller
mv GeneratedTestController_new.java GeneratedTestController.java

# 3. Supprimer l'ancienne entité TestSession
echo "🗑️ Suppression de l'ancienne entité TestSession..."
rm -f ../entity/TestSession.java
rm -f ../repository/TestSessionRepository.java

echo "✅ Migration terminée !"
echo ""
echo "📋 Fichiers modifiés :"
echo "  - Entity: GeneratedTest.java (fusionnée avec TestSession)"
echo "  - Entity: Answer.java (mise à jour)"
echo "  - Entity: EvaluationResult.java (mise à jour)"
echo "  - Repository: GeneratedTestRepository.java (mis à jour)"
echo "  - Repository: AnswerRepository.java (mis à jour)"
echo "  - Controller: GeneratedTestController.java (mis à jour)"
echo "  - Supprimé: TestSession.java et TestSessionRepository.java"
echo ""
echo "🎯 Prochaines étapes :"
echo "  1. Exécuter la migration SQL dans pgAdmin"
echo "  2. Redémarrer l'application Spring Boot"
echo "  3. Tester les fonctionnalités"
