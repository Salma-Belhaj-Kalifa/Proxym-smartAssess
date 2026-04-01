# 🧪 Backend Tests Execution Guide

## 📋 Prérequis

Assurez-vous que les dépendances suivantes sont dans `pom.xml`:

```xml
<dependencies>
    <!-- Spring Boot Test Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- H2 Database for testing -->
    <dependency>
        <groupId>com.h2database</groupId>
        <artifactId>h2</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- TestContainers pour tests d'intégration -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Mockito pour mocking -->
    <dependency>
        <groupId>org.mockito</groupId>
        <artifactId>mockito-core</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

## 🚀 Exécution des Tests

### 1. Tous les Tests Unitaires
```bash
# Depuis le répertoire backend
cd smart-assess-backend

# Exécuter tous les tests
mvn test

# Exécuter avec coverage
mvn clean test jacoco:report

# Voir le rapport de coverage
open target/site/jacoco/index.html
```

### 2. Tests par Catégorie

#### Tests des Services
```bash
mvn test -Dtest="**/service/*Test"
```

#### Tests des Controllers
```bash
mvn test -Dtest="**/controller/*Test"
```

#### Tests des Repositories
```bash
mvn test -Dtest="**/repository/*Test"
```

#### Tests des Entities
```bash
mvn test -Dtest="**/entity/*Test"
```

### 3. Test Spécifique
```bash
# Test spécifique
mvn test -Dtest="CandidatureServiceTest"

# Méthode spécifique
mvn test -Dtest="CandidatureServiceTest#shouldCreateCandidatureWithMultiplePositions"
```

### 4. Tests avec Profils
```bash
# Tests avec profil H2
mvn test -Dspring.profiles.active=test

# Tests avec profil MySQL (nécessite TestContainers)
mvn test -Dspring.profiles.active=test-mysql
```

## 📊 Rapports de Tests

### 1. Rapports JUnit
Les rapports sont générés dans:
- `target/surefire-reports/` - Rapports d'exécution
- `target/failsafe-reports/` - Rapports d'intégration

### 2. Coverage JaCoCo
```bash
# Générer le rapport
mvn clean test jacoco:report

# Ouvrir le rapport
open target/site/jacoco/index.html

# Vérifier les seuils de coverage
mvn jacoco:check
```

### 3. Rapports HTML
```bash
# Générer des rapports détaillés
mvn surefire-report:report

# Ouvrir le rapport
open target/site/surefire-report.html
```

## 🎯 Tests Créés

### 📁 Structure des Fichiers
```
src/test/java/com/example/smart_assess/
├── TestBase.java                           # Classe de base pour les tests
├── service/
│   ├── CandidatureServiceTest.java          # Tests du service Candidature
│   ├── TechnicalProfileServiceTest.java      # Tests du service TechnicalProfile
│   └── AuthenticationServiceTest.java       # Tests du service Auth
├── controller/
│   ├── CandidatureControllerTest.java       # Tests du controller Candidature
│   └── AuthControllerTest.java            # Tests du controller Auth
├── repository/
│   └── CandidatureRepositoryTest.java      # Tests du repository Candidature
└── entity/
    └── CandidatureTest.java               # Tests de l'entity Candidature
```

### 🧪 Types de Tests

#### 1. Tests Unitaires (70% des tests)
- **Services**: Logique métier, validation, gestion d'erreurs
- **Controllers**: Endpoints REST, validation des entrées, réponses HTTP
- **Entities**: Validation des annotations, relations, equals/hashCode

#### 2. Tests d'Intégration (20% des tests)
- **Repositories**: Requêtes JPA, relations @ManyToMany
- **Controllers**: Intégration complète avec services et base de données

#### 3. Tests de Configuration (10% des tests)
- **Security**: JWT, autorisations
- **Database**: Configuration H2/TestContainers

## 📈 Couverture de Code Attendue

### Objectifs:
- **Branches**: 80%
- **Functions**: 85%
- **Lines**: 80%
- **Statements**: 80%

### Classes Critiques à Couvrir:
- `CandidatureService` - 100%
- `TechnicalProfileService` - 100%
- `AuthenticationService` - 100%
- `CandidatureController` - 90%
- `AuthController` - 90%
- `CandidatureRepository` - 80%

## 🐛 Débogage des Tests

### 1. Logs Détaillés
```bash
# Activer les logs DEBUG
mvn test -Dlogging.level.com.example.smart_assess=DEBUG

# Logs SQL
mvn test -Dlogging.level.org.hibernate.SQL=DEBUG
```

### 2. Tests en Mode Debug
```bash
# Lancer les tests en mode debug
mvn test -Dmaven.surefire.debug

# Avec un debugger spécifique
mvn test -Dmaven.surefire.debug="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005"
```

### 3. Tests Parallèles
```bash
# Désactiver le parallélisme pour débogage
mvn test -DforkCount=1 -DreuseForks=false
```

## 🔄 Intégration CI/CD

### GitHub Actions
```yaml
name: Backend Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Run tests
        run: mvn clean test jacoco:report
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./target/site/jacoco/jacoco.xml
```

## 📝 Bonnes Pratiques

### 1. Structure des Tests
- Utiliser `@ExtendWith(MockitoExtension.class)`
- Créer des méthodes `@BeforeEach` pour le setup
- Utiliser des noms de tests descriptifs

### 2. Mocking
- Mock les dépendances externes avec `@Mock`
- Utiliser `@InjectMocks` pour injecter les mocks
- Vérifier les interactions avec `verify()`

### 3. Assertions
- Utiliser `assertThrows()` pour les exceptions
- Utiliser `assertEquals()` avec messages
- Regrouper les assertions logiques

### 4. Données de Test
- Créer des données réalistes
- Utiliser des builders pour les objets complexes
- Isoler les tests les uns des autres

## 🚀 Prochaines Étapes

1. **Exécuter les tests**: `mvn test`
2. **Vérifier la coverage**: `mvn jacoco:report`
3. **Corriger les erreurs**: Adapter les tests à votre code
4. **Ajouter des tests**: Couvrir les cas manquants
5. **Configurer CI/CD**: Automatiser l'exécution

Cette structure vous donne une base solide pour des tests backend complets et maintenus !
