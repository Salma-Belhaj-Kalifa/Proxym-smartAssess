import { test, expect } from '@playwright/test';

test.describe('Manager Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation vers la page de login
    await page.goto('http://localhost:5173/login');
  });

  test('should login as manager and view dashboard', async ({ page }) => {
    // Remplir le formulaire de login
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');

    // Vérifier la redirection vers le dashboard
    await expect(page).toHaveURL('http://localhost:5173/manager/dashboard');
    
    // Vérifier les éléments du dashboard
    await expect(page.getByText(/Tableau de bord/i)).toBeVisible();
    await expect(page.getByText(/Candidatures récentes/i)).toBeVisible();
  });

  test('should view candidatures list', async ({ page }) => {
    // Login
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');

    // Navigation vers la page des candidatures
    await page.click('[data-testid=navigation-applications]');
    await expect(page).toHaveURL('http://localhost:5173/manager/applications');

    // Vérifier la liste des candidatures
    await expect(page.getByText(/Candidatures/i)).toBeVisible();
    
    // Vérifier la candidature de test
    await expect(page.getByText('Salma Belhaj')).toBeVisible();
    await expect(page.getByText('bhksalma0@gmail.com')).toBeVisible();
    await expect(page.getByText('développeur backend')).toBeVisible();
    await expect(page.getByText('Proxym IT')).toBeVisible();
    await expect(page.getByText('PENDING')).toBeVisible();
  });

  test('should view candidate details and generate test', async ({ page }) => {
    // Login
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');

    // Navigation vers les candidatures
    await page.click('[data-testid=navigation-applications]');
    
    // Cliquer sur la candidature
    await page.click('[data-testid=candidature-177]');
    await expect(page).toHaveURL('http://localhost:5173/manager/tests/177');

    // Vérifier les informations du candidat
    await expect(page.getByText(/Informations personnelles/i)).toBeVisible();
    await expect(page.getByText('Salma Ben Haj Khalifa')).toBeVisible();
    await expect(page.getByText('bhksalma0@gmail.com')).toBeVisible();

    // Vérifier l'expertise
    await expect(page.getByText(/Expertise/i)).toBeVisible();
    await expect(page.getByText(/Domaine:/i)).toBeVisible();
    await expect(page.getByText('Software Engineering')).toBeVisible();

    // Vérifier l'éducation
    await expect(page.getByText(/Éducation/i)).toBeVisible();
    await expect(page.getByText('Engineering Cycle')).toBeVisible();
    await expect(page.getByText('Higher Institute of Applied Sciences and Technology of Sousse')).toBeVisible();

    // Vérifier les certifications
    await expect(page.getByText(/Certifications/i)).toBeVisible();
    await expect(page.getByText('Building LLM Applications With Prompt Engineering')).toBeVisible();
    await expect(page.getByText('NVIDIA')).toBeVisible();

    // Vérifier l'éligibilité
    await expect(page.getByText(/Vérification d'éligibilité/i)).toBeVisible();
    await expect(page.getByText(/Candidat ÉLIGIBLE/i)).toBeVisible();

    // Vérifier la configuration du test
    await expect(page.getByText(/Configuration du test/i)).toBeVisible();
    await expect(page.getByText(/Niveau du test/i)).toBeVisible();
    await expect(page.getByText(/Nombre de questions/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Générer le test/i })).toBeVisible();
  });

  test('should generate test successfully', async ({ page }) => {
    // Login et navigation
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await page.click('[data-testid=navigation-applications]');
    await page.click('[data-testid=candidature-177]');

    // Configurer le test
    await page.selectOption('[data-testid=test-level]', 'INTERMEDIATE');
    await page.fill('[data-testid=question-count]', '10');

    // Mock de la réponse API pour éviter les dépendances externes
    await page.route('**/api/tests/generate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          testId: 123,
          testToken: 'abc-123-def-456',
          questions: [
            {
              id: 1,
              question: "What is React.js used for?",
              type: "multiple",
              options: ["Building UI", "Database", "Server", "Network"],
              correctAnswer: 0
            }
          ]
        })
      });
    });

    // Générer le test
    await page.click('[data-testid=generate-test-button]');

    // Attendre la confirmation
    await expect(page.getByText(/Test généré avec succès/i)).toBeVisible();
    
    // Vérifier le bouton de révision
    await expect(page.getByRole('button', { name: /Revoir le test/i })).toBeVisible();
  });

  test('should handle test generation error', async ({ page }) => {
    // Login et navigation
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await page.click('[data-testid=navigation-applications]');
    await page.click('[data-testid=candidature-177]');

    // Mock d'une erreur API
    await page.route('**/api/tests/generate', async route => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Test already exists for this candidature',
          error: 'TEST_ALREADY_EXISTS'
        })
      });
    });

    // Tenter de générer le test
    await page.click('[data-testid=generate-test-button]');

    // Vérifier le message d'erreur
    await expect(page.getByText(/Test déjà existant/i)).toBeVisible();
  });

  test('should navigate to test review', async ({ page }) => {
    // Login et navigation
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await page.click('[data-testid=navigation-applications]');
    await page.click('[data-testid=candidature-177]');

    // Mock d'un test existant
    await page.route('**/api/tests/existing/177', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          existingTestId: 456,
          existingTestStatus: 'SUBMITTED',
          existingTestCreatedAt: '2026-03-30T16:00:00Z'
        })
      });
    });

    // Attendre que le bouton de révision apparaisse
    await expect(page.getByRole('button', { name: /Revoir le test/i })).toBeVisible();

    // Cliquer sur le bouton de révision
    await page.click('[data-testid=review-test-button]');

    // Vérifier la navigation vers la page de révision
    await expect(page).toHaveURL('http://localhost:5173/manager/test-review/177');
  });

  test('should view test results', async ({ page }) => {
    // Login et navigation
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await page.click('[data-testid=navigation-applications]');
    await page.click('[data-testid=candidature-177]');

    // Mock d'un test soumis
    await page.route('**/api/tests/existing/177', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          existingTestId: 456,
          existingTestStatus: 'SUBMITTED',
          existingTestCreatedAt: '2026-03-30T16:00:00Z'
        })
      });
    });

    // Mock des résultats du test
    await page.route('**/api/tests/456/results', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          testId: 456,
          candidateId: 204,
          score: 85,
          totalQuestions: 10,
          correctAnswers: 8,
          timeSpent: 1800, // 30 minutes en secondes
          submittedAt: '2026-03-30T17:30:00Z',
          questions: [
            {
              id: 1,
              question: "What is React.js used for?",
              userAnswer: "Building UI",
              correctAnswer: "Building UI",
              isCorrect: true
            },
            {
              id: 2,
              question: "Explain REST API",
              userAnswer: "REST is an architectural style...",
              correctAnswer: "REST is an architectural style...",
              isCorrect: false
            }
          ]
        })
      });
    });

    // Cliquer sur le bouton de révision
    await page.click('[data-testid=review-test-button]');

    // Dans la page de révision, cliquer sur résultats
    await page.click('[data-testid=view-results-button]');

    // Vérifier la page de résultats
    await expect(page).toHaveURL('http://localhost:5173/manager/test-results/456');
    
    // Vérifier les informations de résultats
    await expect(page.getByText(/Résultats du test/i)).toBeVisible();
    await expect(page.getByText('85%')).toBeVisible();
    await expect(page.getByText('8/10')).toBeVisible();
    await expect(page.getByText('30 minutes')).toBeVisible();
  });

  test('should reject candidature', async ({ page }) => {
    // Login et navigation
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await page.click('[data-testid=navigation-applications]');
    await page.click('[data-testid=candidature-177]');

    // Mock de la mise à jour
    await page.route('**/api/candidatures/177/status', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 177,
          status: 'REJECTED',
          rejectionReason: 'Profile not matching requirements'
        })
      });
    });

    // Cliquer sur le bouton de refus
    await page.click('[data-testid=reject-button]');

    // Remplir la raison du refus
    await page.fill('[data-testid=rejection-reason]', 'Profile not matching requirements');
    await page.click('[data-testid=confirm-rejection]');

    // Vérifier la confirmation
    await expect(page.getByText(/Candidature refusée/i)).toBeVisible();
    
    // Vérifier que le statut est mis à jour
    await expect(page.getByText('REJECTED')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Login
    await page.fill('[data-testid=email]', 'manager@proxym.com');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone
    await page.goto('http://localhost:5173/manager/tests/177');

    // Vérifier que tous les éléments sont visibles en mobile
    await expect(page.getByText(/Informations personnelles/i)).toBeVisible();
    await expect(page.getByText(/Expertise/i)).toBeVisible();
    
    // Vérifier le menu hamburger pour mobile
    await expect(page.getByTestId('mobile-menu-button')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await expect(page.getByText(/Informations personnelles/i)).toBeVisible();
    
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await expect(page.getByText(/Informations personnelles/i)).toBeVisible();
  });
});
