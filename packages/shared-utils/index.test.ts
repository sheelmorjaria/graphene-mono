import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  slugify,
  truncateText,
  capitalizeFirst,
  isValidEmail,
  isValidUKPostalCode,
  isValidPhoneNumber,
  uniqueBy,
  groupBy,
  calculateDiscount,
  calculateTax,
  formatLeadTime,
  calculateEstimatedDelivery,
  buildProductUrl,
  buildCategoryUrl,
  buildSearchUrl,
  isDevelopment,
  isProduction,
  isTest,
  createApiError,
  debounce,
  deepClone
} from './src/index';

describe('Shared Utils', () => {
  describe('Currency formatting', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(123.45)).toBe('£123.45');
      expect(formatCurrency(1000, 'USD')).toBe('$1,000.00');
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2024-01-15');
      expect(formatDate(testDate)).toBe('15 January 2024');
      expect(formatDateTime(testDate)).toContain('15 Jan 2024');
    });
  });

  describe('String utilities', () => {
    it('should slugify text correctly', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Test   Multiple   Spaces')).toBe('test-multiple-spaces');
    });

    it('should truncate text correctly', () => {
      expect(truncateText('Hello world', 8)).toBe('Hello...');
      expect(truncateText('Short', 10)).toBe('Short');
    });

    it('should capitalize first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('Hello');
    });
  });

  describe('Validation utilities', () => {
    it('should validate email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate UK postal codes', () => {
      expect(isValidUKPostalCode('SW1A 1AA')).toBe(true);
      expect(isValidUKPostalCode('invalid')).toBe(false);
    });

    it('should validate phone numbers', () => {
      expect(isValidPhoneNumber('+447123456789')).toBe(true);
      expect(isValidPhoneNumber('invalid')).toBe(false);
    });
  });

  describe('Array utilities', () => {
    it('should get unique items by key', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 1, name: 'Item 1 Duplicate' }
      ] as const;
      const unique = uniqueBy(items, 'id');
      expect(unique).toHaveLength(2);
    });

    it('should group items by key', () => {
      const items = [
        { category: 'A', name: 'Item 1' },
        { category: 'B', name: 'Item 2' },
        { category: 'A', name: 'Item 3' }
      ] as const;
      const grouped = groupBy(items, 'category');
      expect(Object.keys(grouped)).toEqual(['A', 'B']);
      expect(grouped.A).toHaveLength(2);
    });
  });

  describe('Price utilities', () => {
    it('should calculate discount percentage', () => {
      expect(calculateDiscount(100, 80)).toBe(20);
      expect(calculateDiscount(50, 25)).toBe(50);
    });

    it('should calculate tax', () => {
      expect(calculateTax(100, 20)).toBe(20);
      expect(calculateTax(99.99, 5)).toBe(5);
    });
  });

  describe('Lead time utilities', () => {
    it('should format lead time', () => {
      expect(formatLeadTime(5, 5)).toBe('5 working days');
      expect(formatLeadTime(3, 7)).toBe('3-7 working days');
    });

    it('should calculate estimated delivery', () => {
      const today = new Date();
      const delivery = calculateEstimatedDelivery(3);
      expect(delivery.getTime()).toBeGreaterThan(today.getTime());
    });
  });

  describe('URL utilities', () => {
    it('should build URLs correctly', () => {
      expect(buildProductUrl('test-product')).toBe('/products/test-product');
      expect(buildCategoryUrl('electronics')).toBe('/products?category=electronics');
      expect(buildSearchUrl('smartphone')).toBe('/search?q=smartphone');
    });
  });

  describe('Environment utilities', () => {
    it('should detect environment', () => {
      // These tests depend on NODE_ENV which varies
      expect(typeof isDevelopment()).toBe('boolean');
      expect(typeof isProduction()).toBe('boolean');
      expect(typeof isTest()).toBe('boolean');
    });
  });

  describe('Error utilities', () => {
    it('should create API errors', () => {
      const error = createApiError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Debounce utility', () => {
    it('should create debounced function', () => {
      const mockFn = { fn: () => 'test' };
      const debounced = debounce(mockFn.fn, 100);
      expect(typeof debounced).toBe('function');
    });
  });

  describe('Deep clone utility', () => {
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should clone arrays', () => {
      const original = [1, [2, 3]];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });
  });
});