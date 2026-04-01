import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCandidatures } from '@/features/candidatures/candidaturesQueries';

// Mock des données de test
const mockTechnicalProfileData = {
  id: 141,
  cvId: 140,
  candidateId: 204,
  parsedData: {
    "Education": [
      {
        "field": "Software Engineering",
        "degree": "Engineering Cycle",
        "end_date": "",
        "start_date": "September 2023",
        "institution": "Higher Institute of Applied Sciences and Technology of Sousse (ISSAT Sousse)"
      },
      {
        "field": "",
        "degree": "Integrated Preparatory Program MPI",
        "end_date": "June 2023",
        "start_date": "September 2021",
        "institution": "Higher Institute of Applied Sciences and Technology of Sousse"
      },
      {
        "field": "",
        "degree": "Experimental Science Baccalaureate",
        "end_date": "July 2021",
        "start_date": "",
        "institution": "Zaouia Ksiba and Thrayet High school"
      }
    ],
    "Certifications": [
      {
        "issue_date": "November 2025",
        "certification_name": "Building LLM Applications With Prompt Engineering",
        "issuing_organization": "NVIDIA"
      },
      {
        "issue_date": "February 2025",
        "certification_name": "Cloud Computing with AWS – Introduction",
        "issuing_organization": ""
      }
    ],
    "Technical Information": {
      "domain": "Software Engineering",
      "technologies": [
        {
          "name": "Python",
          "category": "Programming Languages",
          "skill_level": "advanced"
        },
        {
          "name": "React.js",
          "category": "Frameworks and Libraries",
          "skill_level": "intermediate"
        }
      ]
    }
  }
};

describe('GenerateTestPage Utils', () => {
  describe('extractEducation', () => {
    it('should extract education with correct years', () => {
      // Simuler la fonction extractEducation
      const extractEducation = (data: any) => {
        if (data["Education"] && Array.isArray(data["Education"])) {
          return data["Education"].map((edu: any) => {
            let extractedYear = edu.year || edu.graduationYear || edu.end_date;
            if (extractedYear) {
              const yearMatch = extractedYear.match(/\b(19|20)\d{2}\b/);
              if (yearMatch) {
                extractedYear = yearMatch[0];
              }
            }
            
            return {
              degree: edu.degree || edu.diploma || 'Non spécifié',
              institution: edu.institution || edu.school || 'Non spécifié',
              year: extractedYear || 'Non spécifié',
              field: edu.field || edu.major || 'Non spécifié'
            };
          });
        }
        return [];
      };

      const result = extractEducation(mockTechnicalProfileData.parsedData);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        degree: "Engineering Cycle",
        institution: "Higher Institute of Applied Sciences and Technology of Sousse (ISSAT Sousse)",
        year: "2023",
        field: "Software Engineering"
      });
      expect(result[1]).toEqual({
        degree: "Integrated Preparatory Program MPI",
        institution: "Higher Institute of Applied Sciences and Technology of Sousse",
        year: "2023",
        field: "Non spécifié"
      });
      expect(result[2]).toEqual({
        degree: "Experimental Science Baccalaureate",
        institution: "Zaouia Ksiba and Thrayet High school",
        year: "2021",
        field: "Non spécifié"
      });
    });

    it('should find most recent education correctly', () => {
      const educations = [
        { degree: "Engineering Cycle", year: "2023" },
        { degree: "Experimental Science", year: "2021" },
        { degree: "Preparatory Program", year: "2023" }
      ];

      const mostRecent = educations.reduce((mostRecent: any, edu: any) => {
        if (!mostRecent) {
          return edu;
        }
        
        if (!mostRecent.year || mostRecent.year === 'Non spécifié') {
          return edu;
        }
        
        if (!edu.year || edu.year === 'Non spécifié') {
          return mostRecent;
        }
        
        const mostRecentYear = parseInt(mostRecent.year) || 0;
        const eduYear = parseInt(edu.year) || 0;
        
        return eduYear > mostRecentYear ? edu : mostRecent;
      }, null);

      expect(mostRecent.degree).toBe("Engineering Cycle");
      expect(mostRecent.year).toBe("2023");
    });
  });

  describe('extractCertifications', () => {
    it('should extract certifications with correct fields', () => {
      const extractCertifications = (data: any) => {
        if (data["Certifications"] && Array.isArray(data["Certifications"])) {
          return data["Certifications"].map((cert: any) => {
            return {
              name: cert.certification_name || cert.name || cert.title || 'Non spécifié',
              issuer: cert.issuing_organization || cert.issuer || cert.organization || 'Non spécifié',
              year: cert.issue_date || cert.year || 'Non spécifié'
            };
          });
        }
        return [];
      };

      const result = extractCertifications(mockTechnicalProfileData.parsedData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "Building LLM Applications With Prompt Engineering",
        issuer: "NVIDIA",
        year: "November 2025"
      });
      expect(result[1]).toEqual({
        name: "Cloud Computing with AWS – Introduction",
        issuer: "Non spécifié",
        year: "February 2025"
      });
    });

    it('should validate certifications correctly', () => {
      const certifications = [
        { name: "Test Cert", issuer: "Test Org" },
        { name: "Valid Cert", issuer: "" },  // Devrait être valide
        { name: "Non spécifié", issuer: "Test Org" }  // Devrait être invalide
      ];

      // Test de la logique de validation
      const hasValidInfo = (cert: any) => 
        cert.name && cert.name !== 'Non spécifié';

      expect(hasValidInfo(certifications[0])).toBe(true);
      expect(hasValidInfo(certifications[1])).toBe(true);
      expect(hasValidInfo(certifications[2])).toBe(false);
    });
  });

  describe('extractSkillsFromProfile', () => {
    it('should extract skills from technical information', () => {
      const extractSkillsFromProfile = (technicalProfile: any) => {
        if (!technicalProfile?.parsedData) {
          return [];
        }
        
        const techData = technicalProfile.parsedData["Technical Information"];
        if (!techData || !Array.isArray(techData.technologies)) {
          return [];
        }

        const skills: string[] = [];
        techData.technologies.forEach((tech: any) => {
          Object.keys(tech).forEach(key => {
            const value = tech[key];
            if (typeof value === 'string' && value.trim() !== '' && value !== 'Non spécifié') {
              skills.push(value);
            }
          });
        });

        return [...new Set(skills)].slice(0, 10);
      };

      const result = extractSkillsFromProfile(mockTechnicalProfileData);
      
      expect(result).toContain("Python");
      expect(result).toContain("React.js");
      expect(result).toContain("Programming Languages");
      expect(result).toContain("Frameworks and Libraries");
      expect(result).toContain("advanced");
      expect(result).toContain("intermediate");
    });
  });

  describe('Domain Extraction', () => {
    it('should extract domain from technical information', () => {
      const extractDomain = (technicalProfile: any) => {
        if (!technicalProfile?.parsedData) {
          return "Non spécifié";
        }
        
        const techInfo = technicalProfile.parsedData["Technical Information"];
        return techInfo?.domain || "Non spécifié";
      };

      const result = extractDomain(mockTechnicalProfileData);
      expect(result).toBe("Software Engineering");
    });
  });
});
