import { vi } from 'vitest';
import { 
  loginValidation, 
  registerValidation, 
  forgotPasswordValidation, 
  resetPasswordValidation, 
  changePasswordValidation,
  verifyEmailValidation 
} from '../authValidators.js';

describe('Auth Validators - Unit Tests', () => {
  describe('loginValidation', () => {
    it('should be defined and be an array', () => {
      expect(loginValidation).toBeDefined();
      expect(Array.isArray(loginValidation)).toBe(true);
      expect(loginValidation.length).toBe(2); // Email and password
    });

    it('should have email validation rules', () => {
      const emailRule = loginValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('email')
      );
      expect(emailRule).toBeDefined();
    });

    it('should have password validation rules', () => {
      const passwordRule = loginValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('password')
      );
      expect(passwordRule).toBeDefined();
    });
  });

  describe('registerValidation', () => {
    it('should be defined and be an array with all required fields', () => {
      expect(registerValidation).toBeDefined();
      expect(Array.isArray(registerValidation)).toBe(true);
      expect(registerValidation.length).toBe(6); // firstName, lastName, email, password, confirmPassword, phone
    });

    it('should validate all required registration fields', () => {
      const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
      
      requiredFields.forEach(field => {
        const rule = registerValidation.find(validation => 
          validation.builder && 
          validation.builder.fields && 
          validation.builder.fields.includes(field)
        );
        expect(rule).toBeDefined();
      });
    });

    it('should include optional phone validation', () => {
      const phoneRule = registerValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('phone')
      );
      expect(phoneRule).toBeDefined();
    });
  });

  describe('forgotPasswordValidation', () => {
    it('should be defined and validate email only', () => {
      expect(forgotPasswordValidation).toBeDefined();
      expect(Array.isArray(forgotPasswordValidation)).toBe(true);
      expect(forgotPasswordValidation.length).toBe(1); // Only email
    });

    it('should have email validation rule', () => {
      const emailRule = forgotPasswordValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('email')
      );
      expect(emailRule).toBeDefined();
    });
  });

  describe('resetPasswordValidation', () => {
    it('should be defined and validate all reset fields', () => {
      expect(resetPasswordValidation).toBeDefined();
      expect(Array.isArray(resetPasswordValidation)).toBe(true);
      expect(resetPasswordValidation.length).toBe(3); // token, newPassword, confirmNewPassword
    });

    it('should validate token field', () => {
      const tokenRule = resetPasswordValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('token')
      );
      expect(tokenRule).toBeDefined();
    });

    it('should validate new password fields', () => {
      const newPasswordRule = resetPasswordValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('newPassword')
      );
      const confirmRule = resetPasswordValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('confirmNewPassword')
      );
      expect(newPasswordRule).toBeDefined();
      expect(confirmRule).toBeDefined();
    });
  });

  describe('changePasswordValidation', () => {
    it('should be defined and validate all change password fields', () => {
      expect(changePasswordValidation).toBeDefined();
      expect(Array.isArray(changePasswordValidation)).toBe(true);
      expect(changePasswordValidation.length).toBe(3); // currentPassword, newPassword, confirmNewPassword
    });

    it('should validate current and new password fields', () => {
      const currentPasswordRule = changePasswordValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('currentPassword')
      );
      const newPasswordRule = changePasswordValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('newPassword')
      );
      expect(currentPasswordRule).toBeDefined();
      expect(newPasswordRule).toBeDefined();
    });
  });

  describe('verifyEmailValidation', () => {
    it('should be defined and validate email verification token', () => {
      expect(verifyEmailValidation).toBeDefined();
      expect(Array.isArray(verifyEmailValidation)).toBe(true);
      expect(verifyEmailValidation.length).toBe(1); // Only token
    });

    it('should validate token field', () => {
      const tokenRule = verifyEmailValidation.find(rule => 
        rule.builder && rule.builder.fields && rule.builder.fields.includes('token')
      );
      expect(tokenRule).toBeDefined();
    });
  });

  describe('Validation Structure', () => {
    it('should have proper express-validator structure', () => {
      const allValidations = [
        ...loginValidation,
        ...registerValidation,
        ...forgotPasswordValidation,
        ...resetPasswordValidation,
        ...changePasswordValidation,
        ...verifyEmailValidation
      ];

      allValidations.forEach(validation => {
        expect(validation).toBeDefined();
        // Express-validator items are functions in the middleware chain
        expect(typeof validation).toBe('function');
      });
    });

    it('should be importable without errors', () => {
      expect(() => {
        const validations = {
          loginValidation,
          registerValidation,
          forgotPasswordValidation,
          resetPasswordValidation,
          changePasswordValidation,
          verifyEmailValidation
        };
        return validations;
      }).not.toThrow();
    });
  });
});