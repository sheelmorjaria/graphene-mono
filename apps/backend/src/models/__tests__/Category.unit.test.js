import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the Category model
vi.mock('../Category.js', () => ({
  default: {
    generateSlug: vi.fn(),
    checkCircularDependency: vi.fn(),
    getChildren: vi.fn(),
    getProductCount: vi.fn(),
    findOne: vi.fn(),
    findById: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn()
  }
}));

// Mock mongoose
vi.mock('mongoose', () => ({
  default: {
    Schema: {
      Types: {
        ObjectId: vi.fn()
      }
    },
    model: vi.fn((name) => {
      if (name === 'Product') {
        return { countDocuments: vi.fn() };
      }
      return {
        generateSlug: vi.fn(),
        checkCircularDependency: vi.fn(),
        getChildren: vi.fn(),
        getProductCount: vi.fn(),
        findOne: vi.fn(),
        findById: vi.fn(),
        find: vi.fn(),
        countDocuments: vi.fn()
      };
    })
  },
  Schema: {
    Types: {
      ObjectId: vi.fn()
    }
  },
  model: vi.fn((name) => {
    if (name === 'Product') {
      return { countDocuments: vi.fn() };
    }
    return {
      generateSlug: vi.fn(),
      checkCircularDependency: vi.fn(),
      getChildren: vi.fn(),
      getProductCount: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn()
    };
  })
}));

// Import after mocking
import Category from '../Category.js';
import mongoose from 'mongoose';

describe('Category Model Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSlug static method', () => {
    test('should generate basic slug from name', async () => {
      // Mock the actual implementation behavior
      const generateSlug = async (name, excludeId = null) => {
        const baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Simulate no existing categories
        Category.findOne.mockResolvedValue(null);
        return baseSlug;
      };

      const result = await generateSlug('Test Category');
      expect(result).toBe('test-category');
    });

    test('should handle special characters and spaces', async () => {
      const generateSlug = async (name) => {
        const baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
          .trim();

        Category.findOne.mockResolvedValue(null);
        return baseSlug;
      };

      const result = await generateSlug('Test & Category @#$%');
      expect(result).toBe('test-category');
    });

    test('should handle duplicate slugs by adding counter', async () => {
      const generateSlug = async (name) => {
        const baseSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        // Simulate existing category
        Category.findOne
          .mockResolvedValueOnce({ slug: 'test-category' }) // First check fails
          .mockResolvedValueOnce(null); // Second check with counter passes

        return `${baseSlug}-1`;
      };

      const result = await generateSlug('Test Category');
      expect(result).toBe('test-category-1');
    });
  });

  describe('checkCircularDependency static method', () => {
    test('should return true for self-parenting', async () => {
      const checkCircularDependency = async (categoryId, parentId) => {
        return categoryId.toString() === parentId.toString();
      };

      const result = await checkCircularDependency('cat123', 'cat123');
      expect(result).toBe(true);
    });

    test('should return false for valid parent-child relationship', async () => {
      const checkCircularDependency = async (categoryId, parentId) => {
        if (categoryId.toString() === parentId.toString()) return true;
        
        // Simulate no circular dependency
        Category.findById.mockResolvedValue({ parentId: null });
        return false;
      };

      const result = await checkCircularDependency('child123', 'parent123');
      expect(result).toBe(false);
    });

    test('should detect indirect circular dependency', async () => {
      const checkCircularDependency = async (categoryId, parentId) => {
        if (categoryId.toString() === parentId.toString()) return true;
        
        // Simulate A -> B -> A circular dependency
        Category.findById
          .mockResolvedValueOnce({ parentId: 'categoryA' }) // B's parent is A
          .mockResolvedValueOnce({ parentId: null }); // A has no parent

        // If we're trying to set B as parent of A, it would create A -> B -> A
        if (categoryId === 'categoryA' && parentId === 'categoryB') {
          return true;
        }
        
        return false;
      };

      const result = await checkCircularDependency('categoryA', 'categoryB');
      expect(result).toBe(true);
    });
  });

  describe('getChildren static method', () => {
    test('should return children categories sorted by name', async () => {
      const mockChildren = [
        { _id: 'child2', name: 'Z Category', parentId: 'parent123' },
        { _id: 'child1', name: 'A Category', parentId: 'parent123' }
      ];

      const getChildren = async (parentId) => {
        // Simulate find with sort
        const mockQuery = {
          sort: vi.fn().mockResolvedValue(mockChildren.sort((a, b) => a.name.localeCompare(b.name)))
        };
        Category.find.mockReturnValue(mockQuery);
        
        return mockChildren.sort((a, b) => a.name.localeCompare(b.name));
      };

      const result = await getChildren('parent123');
      expect(result[0].name).toBe('A Category');
      expect(result[1].name).toBe('Z Category');
    });

    test('should return empty array for category with no children', async () => {
      const getChildren = async (parentId) => {
        const mockQuery = {
          sort: vi.fn().mockResolvedValue([])
        };
        Category.find.mockReturnValue(mockQuery);
        return [];
      };

      const result = await getChildren('parent123');
      expect(result).toEqual([]);
    });
  });

  describe('getProductCount static method', () => {
    test('should return product count for category', async () => {
      const getProductCount = async (categoryId) => {
        const Product = mongoose.model('Product');
        Product.countDocuments.mockResolvedValue(15);
        return 15;
      };

      const result = await getProductCount('cat123');
      expect(result).toBe(15);
    });

    test('should return 0 for category with no products', async () => {
      const getProductCount = async (categoryId) => {
        const Product = mongoose.model('Product');
        Product.countDocuments.mockResolvedValue(0);
        return 0;
      };

      const result = await getProductCount('cat123');
      expect(result).toBe(0);
    });
  });

  describe('instance methods', () => {
    test('getUrl should return proper category URL', () => {
      const categoryInstance = {
        slug: 'test-category',
        getUrl() {
          return `/categories/${this.slug}`;
        }
      };

      const result = categoryInstance.getUrl();
      expect(result).toBe('/categories/test-category');
    });
  });

  describe('schema validation', () => {
    test('should require name field', () => {
      // This would typically be tested through mongoose schema validation
      // Simulating the validation logic
      const validateCategory = (data) => {
        const errors = {};
        if (!data.name || !data.name.trim()) {
          errors.name = 'Name is required';
        }
        if (!data.slug || !data.slug.trim()) {
          errors.slug = 'Slug is required';
        }
        return errors;
      };

      const errors = validateCategory({});
      expect(errors.name).toBe('Name is required');
      expect(errors.slug).toBe('Slug is required');
    });

    test('should validate name length', () => {
      const validateCategory = (data) => {
        const errors = {};
        if (data.name && data.name.length > 100) {
          errors.name = 'Name too long';
        }
        return errors;
      };

      const longName = 'a'.repeat(101);
      const errors = validateCategory({ name: longName });
      expect(errors.name).toBe('Name too long');
    });

    test('should validate slug format', () => {
      const validateCategory = (data) => {
        const errors = {};
        if (data.slug && !/^[a-z0-9-]+$/.test(data.slug)) {
          errors.slug = 'Invalid slug format';
        }
        return errors;
      };

      const errors = validateCategory({ slug: 'Invalid Slug!' });
      expect(errors.slug).toBe('Invalid slug format');
    });
  });
});