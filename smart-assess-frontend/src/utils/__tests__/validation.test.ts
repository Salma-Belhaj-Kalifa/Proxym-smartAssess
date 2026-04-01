import { describe, it, expect } from 'vitest';

describe('Validation Utils', () => {
  describe('Email Validation', () => {
    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
      expect(validateEmail('bhksalma0@gmail.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('Phone Validation', () => {
    const validatePhone = (phone: string) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]{7,15}$/;
      return phoneRegex.test(phone);
    };

    it('should validate correct phone numbers', () => {
      expect(validatePhone('+216 55 344 511')).toBe(true);
      expect(validatePhone('+33612345678')).toBe(true);
      expect(validatePhone('0123456789')).toBe(true);
      expect(validatePhone('+1 (555) 123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('abc')).toBe(false);
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('')).toBe(false);
      expect(validatePhone('+1234567890123456')).toBe(false);
    });
  });

  describe('Domain Matching', () => {
    const isDomainCompatible = (candidateDomain: string, acceptedDomains: string[]) => {
      return acceptedDomains.some(domain => 
        domain.toLowerCase() === candidateDomain.toLowerCase()
      );
    };

    it('should match compatible domains', () => {
      expect(isDomainCompatible('Software Engineering', ['Informatique', 'Software Engineering'])).toBe(true);
      expect(isDomainCompatible('informatique', ['Informatique'])).toBe(true);
      expect(isDomainCompatible('Computer Science', ['Computer Science', 'IT'])).toBe(true);
    });

    it('should reject incompatible domains', () => {
      expect(isDomainCompatible('Marketing', ['Informatique', 'Software Engineering'])).toBe(false);
      expect(isDomainCompatible('Finance', ['Computer Science', 'IT'])).toBe(false);
      expect(isDomainCompatible('', ['Informatique'])).toBe(false);
    });
  });

  describe('Test Configuration Validation', () => {
    const validateTestConfig = (config: any) => {
      const errors: string[] = [];
      
      if (!config.level || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(config.level)) {
        errors.push('Level must be BEGINNER, INTERMEDIATE, or ADVANCED');
      }
      
      if (!config.questionCount || config.questionCount < 1 || config.questionCount > 50) {
        errors.push('Question count must be between 1 and 50');
      }
      
      if (config.focusAreas && (!Array.isArray(config.focusAreas) || config.focusAreas.length === 0)) {
        errors.push('Focus areas must be a non-empty array');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    it('should validate correct test configurations', () => {
      const validConfig = {
        level: 'INTERMEDIATE',
        questionCount: 10,
        focusAreas: ['Python', 'React.js']
      };
      
      const result = validateTestConfig(validConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid test configurations', () => {
      const invalidConfigs = [
        { level: 'INVALID', questionCount: 10 },
        { level: 'INTERMEDIATE', questionCount: 0 },
        { level: 'INTERMEDIATE', questionCount: 100 },
        { level: 'INTERMEDIATE', questionCount: 10, focusAreas: [] }
      ];
      
      invalidConfigs.forEach(config => {
        const result = validateTestConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('File Upload Validation', () => {
    const validateFileUpload = (file: File) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'application/msword'];
      
      const errors: string[] = [];
      
      if (file.size > maxSize) {
        errors.push('File size must be less than 10MB');
      }
      
      if (!allowedTypes.includes(file.type)) {
        errors.push('File must be PDF or Word document');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    };

    it('should validate correct file uploads', () => {
      const validFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateFileUpload(validFile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid file uploads', () => {
      const oversizedFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
      Object.defineProperty(oversizedFile, 'size', { value: 15 * 1024 * 1024 }); // 15MB
      
      const wrongTypeFile = new File(['content'], 'resume.txt', { type: 'text/plain' });
      
      const oversizedResult = validateFileUpload(oversizedFile);
      const wrongTypeResult = validateFileUpload(wrongTypeFile);
      
      expect(oversizedResult.isValid).toBe(false);
      expect(oversizedResult.errors).toContain('File size must be less than 10MB');
      
      expect(wrongTypeResult.isValid).toBe(false);
      expect(wrongTypeResult.errors).toContain('File must be PDF or Word document');
    });
  });

  describe('Date Formatting', () => {
    const formatDate = (date: string | Date) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) {
        return 'Date invalide';
      }
      
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    it('should format dates correctly', () => {
      expect(formatDate('2026-03-30')).toBe('30 mars 2026');
      expect(formatDate('2026-12-25')).toBe('25 décembre 2026');
      expect(formatDate(new Date('2026-01-15'))).toBe('15 janvier 2026');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Date invalide');
      expect(formatDate('')).toBe('Date invalide');
    });
  });

  describe('Score Calculation', () => {
    const calculateScore = (correctAnswers: number, totalQuestions: number) => {
      if (totalQuestions === 0) return 0;
      return Math.round((correctAnswers / totalQuestions) * 100);
    };

    const getScoreLevel = (score: number) => {
      if (score >= 90) return 'Excellent';
      if (score >= 80) return 'Très bien';
      if (score >= 70) return 'Bien';
      if (score >= 60) return 'Assez bien';
      return 'Insuffisant';
    };

    it('should calculate scores correctly', () => {
      expect(calculateScore(8, 10)).toBe(80);
      expect(calculateScore(7, 10)).toBe(70);
      expect(calculateScore(5, 10)).toBe(50);
      expect(calculateScore(0, 10)).toBe(0);
    });

    it('should determine score levels correctly', () => {
      expect(getScoreLevel(95)).toBe('Excellent');
      expect(getScoreLevel(85)).toBe('Très bien');
      expect(getScoreLevel(75)).toBe('Bien');
      expect(getScoreLevel(65)).toBe('Assez bien');
      expect(getScoreLevel(45)).toBe('Insuffisant');
    });
  });
});
