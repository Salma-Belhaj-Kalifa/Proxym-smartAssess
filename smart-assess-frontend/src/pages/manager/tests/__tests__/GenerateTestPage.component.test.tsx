import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GenerateTestPage from '../GenerateTestPage';

// Mock des hooks
vi.mock('@/features/candidatures/candidaturesQueries', () => ({
  useCandidatures: () => ({
    data: [
      {
        id: 177,
        candidateId: 204,
        candidateFirstName: "Salma",
        candidateLastName: "Belhaj",
        candidateEmail: "bhksalma0@gmail.com",
        positionTitle: "développeur backend",
        positionCompany: "Proxym IT",
        status: "PENDING",
        technicalProfiles: [mockTechnicalProfileData]
      }
    ],
    isLoading: false,
    error: null
  }),
}));

vi.mock('@/features/technical-profile/technicalProfileQueries', () => ({
  useTechnicalProfile: () => ({
    data: mockTechnicalProfileData,
    isLoading: false,
    error: null
  }),
}));

// Mock de navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '177' })
  };
});

// Mock du toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Données de test
const mockTechnicalProfileData = {
  id: 141,
  cvId: 140,
  candidateId: 204,
  parsedData: {
    "Basic Information": {
      email: "bhksalma0@gmail.com",
      phone: "+216 55 344 511",
      full_name: "Salma Ben Haj Khalifa"
    },
    "Technical Information": {
      "domain": "Software Engineering",
      "technologies": [
        {
          "name": "Python",
          "category": "Programming Languages",
          "skill_level": "advanced"
        }
      ]
    },
    "Education": [
      {
        "degree": "Engineering Cycle",
        "end_date": "",
        "start_date": "September 2023",
        "institution": "Higher Institute of Applied Sciences and Technology of Sousse (ISSAT Sousse)"
      }
    ],
    "Certifications": [
      {
        "certification_name": "Building LLM Applications With Prompt Engineering",
        "issuing_organization": "NVIDIA",
        "issue_date": "November 2025"
      }
    ],
    "Summary": {
      "summary": "Highly motivated software engineering student..."
    }
  }
};

// Wrapper pour les tests
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('GenerateTestPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render candidate personal information', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Informations personnelles/i)).toBeInTheDocument();
      expect(screen.getByText('Salma Ben Haj Khalifa')).toBeInTheDocument();
      expect(screen.getByText('bhksalma0@gmail.com')).toBeInTheDocument();
    });
  });

  it('should render expertise section', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Expertise/i)).toBeInTheDocument();
      expect(screen.getByText(/Domaine:/i)).toBeInTheDocument();
      expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    });
  });

  it('should render education section', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Éducation/i)).toBeInTheDocument();
      expect(screen.getByText('Engineering Cycle')).toBeInTheDocument();
      expect(screen.getByText('Higher Institute of Applied Sciences and Technology of Sousse (ISSAT Sousse)')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
    });
  });

  it('should render certifications section', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Certifications/i)).toBeInTheDocument();
      expect(screen.getByText('Building LLM Applications With Prompt Engineering')).toBeInTheDocument();
      expect(screen.getByText('NVIDIA')).toBeInTheDocument();
      expect(screen.getByText('November 2025')).toBeInTheDocument();
    });
  });

  it('should render profile summary', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Résumé du profil/i)).toBeInTheDocument();
      expect(screen.getByText(/Highly motivated software engineering student/i)).toBeInTheDocument();
    });
  });

  it('should show eligibility check', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Vérification d'éligibilité/i)).toBeInTheDocument();
      expect(screen.getByText(/développeur backend/i)).toBeInTheDocument();
      expect(screen.getByText(/Software Engineering.*compatible/i)).toBeInTheDocument();
      expect(screen.getByText(/Candidat ÉLIGIBLE/i)).toBeInTheDocument();
    });
  });

  it('should show test generation form', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Configuration du test/i)).toBeInTheDocument();
      expect(screen.getByText(/Niveau du test/i)).toBeInTheDocument();
      expect(screen.getByText(/Nombre de questions/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Générer le test/i })).toBeInTheDocument();
    });
  });

  it('should handle test generation', async () => {
    // Mock de la fonction fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        testId: 123,
        testToken: 'abc123',
        questions: [
          { question: 'Test question 1', type: 'multiple' },
          { question: 'Test question 2', type: 'technical' }
        ]
      }),
    } as Response);

    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /Générer le test/i });
      expect(generateButton).toBeInTheDocument();
    });

    // Cliquer sur le bouton de génération
    const generateButton = screen.getByRole('button', { name: /Générer le test/i });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tests/generate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.any(String)
          })
        })
      );
    });
  });

  it('should show loading state', async () => {
    // Mock du hook pour simuler le chargement
    vi.doMock('@/features/candidatures/candidaturesQueries', () => ({
      useCandidatures: () => ({
        data: [],
        isLoading: true,
        error: null
      }),
    }));

    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('should show error state', async () => {
    // Mock du hook pour simuler une erreur
    vi.doMock('@/features/candidatures/candidaturesQueries', () => ({
      useCandidatures: () => ({
        data: [],
        isLoading: false,
        error: new Error('Failed to load candidatures')
      }),
    }));

    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
    });
  });

  it('should handle navigation to test results', async () => {
    render(
      <TestWrapper>
        <GenerateTestPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Simuler un test existant
      const reviewButton = screen.getByRole('button', { name: /Revoir le test/i });
      if (reviewButton) {
        fireEvent.click(reviewButton);
        expect(mockNavigate).toHaveBeenCalledWith('/manager/test-review/177');
      }
    });
  });
});
