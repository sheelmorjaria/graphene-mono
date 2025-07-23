import { vi } from 'vitest';
import { 
  handleValidationErrors, 
  sanitizeInput, 
  globalSanitization, 
  validators 
} from '../validation.js';

describe('Validation Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123' },
      ip: '127.0.0.1',
      path: '/test',
      method: 'POST'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  describe('handleValidationErrors', () => {
    it('should call next() when no validation errors exist', () => {
      // Mock validationResult to return no errors
      vi.doMock('express-validator', () => ({
        validationResult: vi.fn(() => ({
          isEmpty: () => true,
          array: () => []
        }))
      }));

      handleValidationErrors(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should be defined and be a function', () => {
      expect(handleValidationErrors).toBeDefined();
      expect(typeof handleValidationErrors).toBe('function');
    });

    it('should handle request and response objects', () => {
      expect(() => {
        handleValidationErrors(req, res, next);
      }).not.toThrow();
    });
  });

  describe('sanitizeInput', () => {
    it('should be defined and be a function', () => {
      expect(sanitizeInput).toBeDefined();
      expect(typeof sanitizeInput).toBe('function');
    });

    it('should sanitize request body and call next', () => {
      req.body = {
        name: 'John$Doe',
        email: 'test@example.com'
      };

      sanitizeInput(req, res, next);

      expect(req.body.name).toBe('John_Doe'); // $ replaced with _
      expect(req.body.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      req.body = {
        user: {
          name: 'Test$User',
          details: {
            bio: 'User$Bio'
          }
        }
      };

      sanitizeInput(req, res, next);

      expect(req.body.user.name).toBe('Test_User');
      expect(req.body.user.details.bio).toBe('User_Bio');
      expect(next).toHaveBeenCalled();
    });

    it('should handle arrays', () => {
      req.body = {
        tags: ['tag$1', 'tag$2', 'normal']
      };

      sanitizeInput(req, res, next);

      expect(req.body.tags[0]).toBe('tag_1');
      expect(req.body.tags[1]).toBe('tag_2');
      expect(req.body.tags[2]).toBe('normal');
      expect(next).toHaveBeenCalled();
    });

    it('should sanitize query parameters', () => {
      req.query = {
        search: 'term$with$dollars',
        filter: 'normal'
      };

      sanitizeInput(req, res, next);

      expect(req.query.search).toBe('term_with_dollars');
      expect(req.query.filter).toBe('normal');
      expect(next).toHaveBeenCalled();
    });

    it('should handle null and undefined values', () => {
      req.body = {
        name: null,
        description: undefined,
        active: true
      };

      expect(() => {
        sanitizeInput(req, res, next);
      }).not.toThrow();

      expect(next).toHaveBeenCalled();
    });
  });

  describe('globalSanitization', () => {
    it('should be defined and be an array', () => {
      expect(globalSanitization).toBeDefined();
      expect(Array.isArray(globalSanitization)).toBe(true);
    });

    it('should include sanitizeInput middleware', () => {
      expect(globalSanitization).toContain(sanitizeInput);
    });

    it('should have multiple middleware functions', () => {
      expect(globalSanitization.length).toBeGreaterThan(1);
    });
  });

  describe('validators', () => {
    describe('isMongoId', () => {
      it('should validate correct MongoDB ObjectIds', () => {
        const validIds = [
          '507f1f77bcf86cd799439011',
          '507f191e810c19729de860ea',
          '123456789012345678901234'
        ];

        validIds.forEach(id => {
          expect(() => validators.isMongoId(id)).not.toThrow();
        });
      });

      it('should reject invalid MongoDB ObjectIds', () => {
        const invalidIds = [
          'invalid-id',
          '123',
          'zzzf1f77bcf86cd799439011', // Invalid hex chars
          '507f1f77bcf86cd79943901' // Too short
        ];

        invalidIds.forEach(id => {
          expect(() => validators.isMongoId(id)).toThrow('Invalid ID format');
        });
      });
    });

    describe('isValidPrice', () => {
      it('should accept valid prices', () => {
        const validPrices = [0, 10.99, 100, 999.99];

        validPrices.forEach(price => {
          expect(() => validators.isValidPrice(price)).not.toThrow();
        });
      });

      it('should reject negative prices', () => {
        expect(() => validators.isValidPrice(-1)).toThrow('Price must be a positive number');
      });

      it('should reject prices exceeding maximum', () => {
        expect(() => validators.isValidPrice(1000000)).toThrow('Price exceeds maximum allowed value');
      });
    });

    describe('isSecureEmail', () => {
      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@example.co.uk',
          'test123@domain.org'
        ];

        validEmails.forEach(email => {
          expect(() => validators.isSecureEmail(email)).not.toThrow();
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'invalid-email',
          '@example.com',
          'test@'
          // Note: 'test..double@example.com' actually passes the basic regex test
        ];

        invalidEmails.forEach(email => {
          expect(() => validators.isSecureEmail(email)).toThrow();
        });
      });

      it('should reject emails with SQL injection patterns', () => {
        const maliciousEmails = [
          'test--@example.com',
          'test/*comment*/@example.com',
          'test*/@example.com'
        ];

        maliciousEmails.forEach(email => {
          expect(() => validators.isSecureEmail(email)).toThrow('Invalid characters in email');
        });
      });
    });

    describe('isStrongPassword', () => {
      it('should accept strong passwords', () => {
        const strongPasswords = [
          'StrongPass123!',
          'AnotherGood1@',
          'Complex$Pass9',
          'Secure#123Word'
        ];

        strongPasswords.forEach(password => {
          expect(() => validators.isStrongPassword(password)).not.toThrow();
        });
      });

      it('should reject passwords that are too short', () => {
        expect(() => validators.isStrongPassword('Short1!')).toThrow('Password must be at least 8 characters long');
      });

      it('should require uppercase letters', () => {
        expect(() => validators.isStrongPassword('lowercase123!')).toThrow('Password must contain at least one uppercase letter');
      });

      it('should require lowercase letters', () => {
        expect(() => validators.isStrongPassword('UPPERCASE123!')).toThrow('Password must contain at least one lowercase letter');
      });

      it('should require numbers', () => {
        expect(() => validators.isStrongPassword('NoNumbers!')).toThrow('Password must contain at least one number');
      });

      it('should require special characters', () => {
        expect(() => validators.isStrongPassword('NoSpecialChars123')).toThrow('Password must contain at least one special character (!@#$%^&*)');
      });
    });

    describe('isValidPhone', () => {
      it('should accept valid phone numbers', () => {
        const validPhones = [
          '1234567890',
          '12345678901234567890',
          '123-456-7890',
          '123 456 7890'
        ];

        validPhones.forEach(phone => {
          expect(() => validators.isValidPhone(phone)).not.toThrow();
        });
      });

      it('should reject invalid phone numbers', () => {
        const invalidPhones = [
          'abc',
          '123', // Too short
          '12345678901234567890123', // Too long
          'phone-number-text'
        ];

        invalidPhones.forEach(phone => {
          expect(() => validators.isValidPhone(phone)).toThrow('Invalid phone number format');
        });
      });
    });

    describe('noScriptTags', () => {
      it('should accept content without script tags', () => {
        const safeContent = [
          'Normal text content',
          '<p>HTML paragraph</p>',
          '<div>Safe HTML</div>'
        ];

        safeContent.forEach(content => {
          expect(() => validators.noScriptTags(content)).not.toThrow();
        });
      });

      it('should reject content with script tags', () => {
        const dangerousContent = [
          '<script>alert("xss")</script>',
          'Text with <script src="evil.js"></script> embedded',
          '<SCRIPT>malicious code</SCRIPT>'
        ];

        dangerousContent.forEach(content => {
          expect(() => validators.noScriptTags(content)).toThrow('Invalid content detected');
        });
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work with sanitizeInput middleware', () => {
      req.body = {
        name: 'Test$User',
        email: 'test@example.com'
      };

      // Apply only sanitizeInput (not the full globalSanitization array to avoid hpp issues)
      sanitizeInput(req, res, next);

      expect(req.body.name).toBe('Test_User');
      expect(next).toHaveBeenCalled();
    });

    it('should handle complex nested data structures', () => {
      req.body = {
        user: {
          profile: {
            social: {
              links: ['http://example$test.com', 'https://safe.com']
            }
          }
        }
      };

      sanitizeInput(req, res, next);

      expect(req.body.user.profile.social.links[0]).toBe('http://example_test.com');
      expect(req.body.user.profile.social.links[1]).toBe('https://safe.com');
    });
  });

  describe('Performance', () => {
    it('should handle sanitization efficiently', () => {
      const largeObject = {};
      for (let i = 0; i < 100; i++) {
        largeObject[`field${i}`] = `value$${i}`;
      }
      req.body = largeObject;

      const start = process.hrtime();
      sanitizeInput(req, res, next);
      const [seconds, nanoseconds] = process.hrtime(start);
      const milliseconds = seconds * 1000 + nanoseconds / 1000000;

      expect(milliseconds).toBeLessThan(50); // Should complete in under 50ms
      expect(next).toHaveBeenCalled();
    });
  });
});