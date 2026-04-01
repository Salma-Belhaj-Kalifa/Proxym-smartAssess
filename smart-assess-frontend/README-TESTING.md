# 🧪 Smart Assess - Guide de Testing

Ce document explique comment utiliser la suite de tests complète pour l'application Smart Assess.

## 📋 Table des Matières

1. [Types de Tests](#types-de-tests)
2. [Installation](#installation)
3. [Scripts Disponibles](#scripts-disponibles)
4. [Tests Unitaires](#tests-unitaires)
5. [Tests d'Intégration](#tests-dintégration)
6. [Tests End-to-End](#tests-end-to-end)
7. [Coverage](#coverage)
8. [Bonnes Pratiques](#bonnes-pratiques)

## 🎯 Types de Tests

### 1. Tests Unitaires
- **Purpose**: Tester les fonctions et composants isolément
- **Tools**: Vitest + React Testing Library
- **Location**: `src/**/__tests__/*.test.ts`

### 2. Tests d'Intégration
- **Purpose**: Tester les interactions entre les composants et APIs
- **Tools**: Vitest + MSW (Mock Service Worker)
- **Location**: `src/integration/__tests__/*.test.ts`

### 3. Tests End-to-End (E2E)
- **Purpose**: Tester les workflows utilisateur complets
- **Tools**: Playwright
- **Location**: `e2e/*.spec.ts`

## 🚀 Installation

```bash
# Installer les dépendances de test
npm install

# Ou si vous utilisez yarn
yarn install
```

## 📜 Scripts Disponibles

```json
{
  "test": "vitest run",                    // Tests unitaires
  "test:watch": "vitest",                  // Tests unitaires en mode watch
  "test:coverage": "vitest run --coverage", // Tests unitaires avec coverage
  "test:integration": "vitest --testPathPattern=integration", // Tests d'intégration
  "test:e2e": "playwright test",            // Tests E2E headless
  "test:e2e:headed": "playwright test --headed", // Tests E2E avec browser visible
  "test:e2e:ui": "playwright test --ui"     // Tests E2E avec interface UI
}
```

## 🧪 Tests Unitaires

### Exécuter les tests unitaires
```bash
# Exécuter tous les tests unitaires
npm run test

# Exécuter en mode watch (re-exécution automatique)
npm run test:watch

# Exécuter avec coverage
npm run test:coverage
```

### Structure des tests unitaires
```
src/
├── pages/manager/tests/__tests__/
│   ├── GenerateTestPage.utils.test.ts    # Tests des fonctions utilitaires
│   └── GenerateTestPage.component.test.tsx # Tests des composants React
├── utils/__tests__/
│   └── validation.test.ts               # Tests des fonctions de validation
└── test/
    └── setup.ts                        # Configuration globale des tests
```

### Exemples de tests unitaires

#### Test de fonction utilitaire
```typescript
import { describe, it, expect } from 'vitest';

describe('extractEducation', () => {
  it('should extract education with correct years', () => {
    const mockData = {
      Education: [
        { degree: "Engineering", end_date: "June 2023" }
      ]
    };
    
    const result = extractEducation(mockData);
    expect(result[0].year).toBe("2023");
  });
});
```

#### Test de composant React
```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('GenerateTestPage', () => {
  it('should render candidate information', () => {
    render(<GenerateTestPage />);
    expect(screen.getByText('Salma Ben Haj Khalifa')).toBeInTheDocument();
  });
});
```

## 🔗 Tests d'Intégration

### Exécuter les tests d'intégration
```bash
npm run test:integration
```

### Configuration MSW
Les tests d'intégration utilisent MSW pour mock les APIs:

```typescript
// src/integration/setup/server.ts
import { setupServer, rest } from 'msw/node';

export const server = setupServer(
  rest.get('*/api/candidatures', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockCandidatures));
  })
);
```

### Exemple de test d'intégration
```typescript
import { describe, it, expect } from 'vitest';
import { server } from '../setup/server.js';

describe('Candidature API', () => {
  it('should fetch candidatures successfully', async () => {
    const response = await fetch('/api/candidatures');
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveLength(1);
  });
});
```

## 🎭 Tests End-to-End

### Exécuter les tests E2E
```bash
# Tests headless (recommandé pour CI/CD)
npm run test:e2e

# Tests avec browser visible (pour débogage)
npm run test:e2e:headed

# Tests avec interface UI
npm run test:e2e:ui
```

### Configuration Playwright
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }},
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }},
    { name: 'webkit', use: { ...devices['Desktop Safari'] }}
  ]
});
```

### Exemple de test E2E
```typescript
import { test, expect } from '@playwright/test';

test('should complete manager workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'manager@proxym.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');
  
  // Vérifier dashboard
  await expect(page).toHaveURL('/manager/dashboard');
  
  // Navigation et actions
  await page.click('[data-testid=navigation-applications]');
  await expect(page.getByText('Candidatures')).toBeVisible();
});
```

## 📊 Coverage

### Générer le rapport de coverage
```bash
npm run test:coverage
```

### Seuils de Coverage
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Rapports
Les rapports de coverage sont générés dans :
- `coverage/index.html` - Rapport interactif
- `coverage/coverage.json` - Données brutes
- `coverage/text-summary` - Résumé console

## 🎯 Bonnes Pratiques

### 1. Structure des Tests
- **Nom descriptif**: `should [verbe] [résultat attendu]`
- **Un test par cas**: Un assert par test
- **AAA Pattern**: Arrange, Act, Assert

### 2. Mocks et Stubs
- **Utiliser MSW** pour les APIs
- **Mock localStorage/sessionStorage** dans le setup
- **Isoler les dépendances externes**

### 3. Selecteurs de Test
- **Utiliser data-testid**: Préférez `data-testid` aux classes CSS
- **Éviter les sélecteurs fragiles**: Évitez les sélecteurs CSS complexes
- **Accessibilité**: Utilisez des rôles ARIA quand possible

### 4. Tests de Composants
- **Tester les props**: Différentes combinaisons de props
- **Tester les états**: Loading, error, success
- **Tester les interactions**: Clicks, formulaires, navigation

### 5. Tests d'API
- **Cas positifs**: Succès attendu
- **Cas négatifs**: Erreurs attendues
- **Cas limites**: Valeurs limites, données invalides

### 6. Tests E2E
- **Workflows complets**: Testez les parcours utilisateur réels
- **Multi-browser**: Testez sur Chrome, Firefox, Safari
- **Responsive**: Testez mobile, tablet, desktop

## 🐛 Débogage

### Tests Unitaires
```bash
# Mode watch avec débogage
npm run test:watch

# Ajouter des console.log dans les tests
console.log('Debug:', variable);
```

### Tests E2E
```bash
# Mode headed pour voir le browser
npm run test:e2e:headed

# Mode pas-à-pas
npm run test:e2e --debug

# Screenshots en cas d'échec
# Playwright génère automatiquement des screenshots
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
```

### Coverage Reporting
```bash
# Installer codecov
npm install --save-dev codecov

# Envoyer coverage à Codecov
npm run test:coverage && codecov
```

## 📝 Checklist de Testing

### Avant de committer :
- [ ] Tous les tests passent localement
- [ ] Coverage >= 70%
- [ ] Tests E2E passent sur tous les browsers
- [ ] Pas de console.errors
- [ ] Accessibilité vérifiée

### Pour les nouvelles fonctionnalités :
- [ ] Tests unitaires écrits
- [ ] Tests d'intégration écrits
- [ ] Tests E2E écrits
- [ ] Documentation mise à jour
- [ ] CI/CD mis à jour

## 🚀 Ressources Utiles

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

### Outils
- **VS Code Extensions**: Vitest, Playwright, ESLint
- **Debugging**: Chrome DevTools, Playwright Inspector
- **Coverage**: Istanbul, Codecov, Coveralls

---

## 🎯 Prochaines Étapes

1. **Exécuter les tests existants** : `npm run test`
2. **Ajouter de nouveaux tests** pour les fonctionnalités manquantes
3. **Améliorer le coverage** : Viser 80%+
4. **Configurer CI/CD** : Intégrer avec GitHub Actions
5. **Monitoring** : Ajouter des tests de performance

Pour toute question sur les tests, n'hésitez pas à consulter la documentation ou à créer une issue dans le projet.
