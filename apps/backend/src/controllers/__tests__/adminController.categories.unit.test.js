import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the Category model
vi.mock('../../models/Category.js', () => ({
  default: Object.assign(
    vi.fn().mockImplementation((data) => ({
      ...data,
      save: vi.fn(),
      populate: vi.fn()
    })),
    {
      find: vi.fn(),
      findById: vi.fn(),
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
      generateSlug: vi.fn(),
      checkCircularDependency: vi.fn(),
      getChildren: vi.fn(),
      getProductCount: vi.fn()
    }
  )
}));

// Import the functions to test after mocking
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from '../adminController.js';

// Import Category for testing
import Category from '../../models/Category.js';

describe('Admin Controller - Category Management Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      params: {},
      body: {},
      user: { userId: 'admin123' }
    };
    
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };
  });

  describe('getCategories', () => {
    test('should return all categories with product counts', async () => {
      const mockCategories = [
        { _id: 'cat1', name: 'Electronics', slug: 'electronics', parentId: null },
        { _id: 'cat2', name: 'Smartphones', slug: 'smartphones', parentId: { _id: 'cat1', name: 'Electronics' } }
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockCategories)
      };

      Category.find.mockReturnValue(mockQuery);
      Category.getProductCount.mockResolvedValueOnce(5).mockResolvedValueOnce(3);

      await getCategories(req, res);

      expect(Category.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          categories: [
            { ...mockCategories[0], productCount: 5 },
            { ...mockCategories[1], productCount: 3 }
          ]
        }
      });
    });

    test('should handle database errors', async () => {
      Category.find.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await getCategories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error while fetching categories'
      });
    });
  });

  describe('getCategoryById', () => {
    test('should return category successfully', async () => {
      const mockCategoryData = {
        _id: 'cat123',
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test description',
        parentId: { _id: 'parent123', name: 'Parent Category' }
      };

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockCategoryData)
      };

      Category.findById.mockReturnValue(mockQuery);
      Category.getProductCount.mockResolvedValue(10);
      req.params.categoryId = 'cat123';

      await getCategoryById(req, res);

      expect(Category.findById).toHaveBeenCalledWith('cat123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          category: { ...mockCategoryData, productCount: 10 }
        }
      });
    });

    test('should return 404 for non-existent category', async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      };

      Category.findById.mockReturnValue(mockQuery);
      req.params.categoryId = 'nonexistent';

      await getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      });
    });

    test('should return 400 for missing category ID', async () => {
      req.params.categoryId = '';

      await getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category ID is required'
      });
    });

    test('should handle invalid category ID format', async () => {
      const error = new Error('Cast error');
      error.name = 'CastError';

      Category.findById.mockImplementation(() => {
        throw error;
      });
      req.params.categoryId = 'invalid-id';

      await getCategoryById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid category ID format'
      });
    });
  });

  describe('createCategory', () => {
    test('should create category successfully', async () => {
      const categoryData = {
        name: 'New Category',
        slug: 'new-category',
        description: 'New category description',
        parentId: null
      };

      req.body = categoryData;

      // Mock slug generation
      Category.generateSlug.mockResolvedValue('new-category');

      // Mock category creation
      const mockNewCategory = {
        _id: 'newcat123',
        ...categoryData,
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue({
          _id: 'newcat123',
          ...categoryData
        })
      };

      Category.mockReturnValue(mockNewCategory);

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category created successfully',
        data: { category: expect.any(Object) }
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = {}; // Missing name

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category name is required'
      });
    });

    test('should return 400 for duplicate slug', async () => {
      req.body = {
        name: 'Test Category',
        slug: 'existing-slug'
      };

      // Mock existing category with same slug
      Category.findOne.mockResolvedValue({ _id: 'existing', slug: 'existing-slug' });

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category slug already exists. Please use a unique slug.'
      });
    });

    test('should return 400 for invalid parent category', async () => {
      req.body = {
        name: 'Test Category',
        parentId: 'invalid-parent'
      };

      Category.findById.mockResolvedValue(null); // Parent not found

      await createCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid parent category ID'
      });
    });
  });

  describe('updateCategory', () => {
    test('should update category successfully', async () => {
      const existingCategory = {
        _id: 'cat123',
        name: 'Old Category',
        slug: 'old-category',
        description: 'Old description'
      };

      const updateData = {
        name: 'Updated Category',
        slug: 'updated-category',
        description: 'Updated description'
      };

      req.params.categoryId = 'cat123';
      req.body = updateData;

      Category.findById.mockResolvedValue(existingCategory);
      Category.findOne.mockResolvedValue(null); // No duplicate slug

      const updatedCategory = { ...existingCategory, ...updateData };
      const mockPopulatedCategory = {
        ...updatedCategory,
        populate: vi.fn().mockReturnValue(updatedCategory)
      };

      Category.findByIdAndUpdate.mockReturnValue(mockPopulatedCategory);

      await updateCategory(req, res);

      expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
        'cat123',
        expect.objectContaining({
          name: 'Updated Category',
          slug: 'updated-category',
          description: 'Updated description'
        }),
        { new: true, runValidators: true }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category updated successfully',
        data: { category: updatedCategory }
      });
    });

    test('should return 404 for non-existent category', async () => {
      req.params.categoryId = 'nonexistent';
      req.body = { name: 'Test', slug: 'test' };

      Category.findById.mockResolvedValue(null);

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.params.categoryId = 'cat123';
      req.body = {}; // Missing name

      Category.findById.mockResolvedValue({ _id: 'cat123' });

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category name is required'
      });
    });

    test('should handle circular dependency prevention', async () => {
      req.params.categoryId = 'cat123';
      req.body = { name: 'Category', parentId: 'parent123' };

      Category.findById.mockResolvedValueOnce({ _id: 'cat123' }); // Existing category
      Category.findById.mockResolvedValueOnce({ _id: 'parent123' }); // Parent exists
      Category.checkCircularDependency.mockResolvedValue(true); // Would create circular dependency

      await updateCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot set parent category: this would create a circular dependency'
      });
    });
  });

  describe('deleteCategory', () => {
    test('should delete category successfully', async () => {
      const category = {
        _id: 'cat123',
        name: 'Test Category'
      };

      req.params.categoryId = 'cat123';

      Category.findById.mockResolvedValue(category);
      Category.getProductCount.mockResolvedValue(0); // No associated products
      Category.getChildren.mockResolvedValue([]); // No child categories
      Category.findByIdAndDelete.mockResolvedValue(category);

      await deleteCategory(req, res);

      expect(Category.findByIdAndDelete).toHaveBeenCalledWith('cat123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Category deleted successfully'
      });
    });

    test('should return 404 for non-existent category', async () => {
      req.params.categoryId = 'nonexistent';

      Category.findById.mockResolvedValue(null);

      await deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Category not found'
      });
    });

    test('should prevent deletion when category has associated products', async () => {
      req.params.categoryId = 'cat123';

      Category.findById.mockResolvedValue({ _id: 'cat123', name: 'Category' });
      Category.getProductCount.mockResolvedValue(5); // Has associated products

      await deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete category. It has 5 associated product(s). Please reassign products to another category first.'
      });
    });

    test('should prevent deletion when category has child categories', async () => {
      req.params.categoryId = 'cat123';

      Category.findById.mockResolvedValue({ _id: 'cat123', name: 'Category' });
      Category.getProductCount.mockResolvedValue(0);
      Category.getChildren.mockResolvedValue([
        { _id: 'child1', name: 'Child 1' },
        { _id: 'child2', name: 'Child 2' }
      ]);

      await deleteCategory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Cannot delete category. It has 2 child categories. Please reassign or delete child categories first.'
      });
    });
  });
});