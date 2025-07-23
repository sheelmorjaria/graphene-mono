import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the models
vi.mock('../../models/Product.js', () => ({
  default: Object.assign(
    vi.fn().mockImplementation(() => ({
      save: vi.fn(),
      populate: vi.fn()
    })),
    {
      findById: vi.fn(),
      findOne: vi.fn(),
      findByIdAndUpdate: vi.fn()
    }
  )
}));

vi.mock('../../models/Category.js', () => ({
  default: {
    findById: vi.fn()
  }
}));

// Import the functions to test after mocking
import { createProduct, updateProduct, getProductById } from '../adminController.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';

describe('Admin Controller - Product CRUD Unit Tests', () => {
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

  describe('getProductById', () => {
    test('should return product successfully', async () => {
      const mockProductData = {
        _id: 'product123',
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100,
        category: { _id: 'cat123', name: 'Test Category' }
      };

      const mockPopulatedQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProductData)
      };
      
      Product.findById.mockReturnValue(mockPopulatedQuery);
      req.params.productId = 'product123';

      await getProductById(req, res);

      expect(Product.findById).toHaveBeenCalledWith('product123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { product: mockProductData }
      });
    });

    test('should return 404 for non-existent product', async () => {
      const mockPopulatedQuery = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null)
      };
      
      Product.findById.mockReturnValue(mockPopulatedQuery);
      req.params.productId = 'nonexistent';

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    test('should return 400 for missing product ID', async () => {
      req.params.productId = '';

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product ID is required'
      });
    });

    test('should handle invalid product ID format', async () => {
      const error = new Error('Cast error');
      error.name = 'CastError';
      
      Product.findById.mockImplementation(() => {
        throw error;
      });
      req.params.productId = 'invalid-id';

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID format'
      });
    });
  });

  describe('createProduct', () => {
    test('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        sku: 'NEW-001',
        price: '150',
        stockQuantity: '10',
        category: 'cat123'
      };

      req.body = productData;

      // Mock category validation
      Category.findById.mockResolvedValue({ _id: 'cat123', name: 'Test Category' });
      
      // Mock SKU uniqueness check
      Product.findOne.mockResolvedValueOnce(null); // SKU check
      Product.findOne.mockResolvedValueOnce(null); // Slug check

      // Mock product creation
      const mockNewProduct = {
        _id: 'newproduct123',
        name: 'New Product',
        sku: 'NEW-001',
        price: 150,
        stockQuantity: 10,
        category: 'cat123'
      };

      // Mock the Product constructor to return the instance with methods
      const mockProductInstance = {
        ...mockNewProduct,
        save: vi.fn().mockResolvedValue(mockNewProduct),
        populate: vi.fn().mockImplementation(function() {
          // Mutate this instance to add populated category
          this.category = { _id: 'cat123', name: 'Test Category' };
          return this;
        })
      };
      
      Product.mockReturnValue(mockProductInstance);

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: { 
          product: expect.objectContaining({
            ...mockNewProduct,
            category: { _id: 'cat123', name: 'Test Category' }
          })
        }
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = { name: 'Product' }; // Missing SKU, price, stockQuantity

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name, SKU, price, and stock quantity are required'
      });
    });

    test('should return 400 for duplicate SKU', async () => {
      req.body = {
        name: 'Product',
        sku: 'EXISTING-001',
        price: '100',
        stockQuantity: '5'
      };

      // Mock existing product with same SKU
      Product.findOne.mockResolvedValue({ _id: 'existing', sku: 'EXISTING-001' });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'SKU already exists. Please use a unique SKU.'
      });
    });

    test('should return 400 for invalid category', async () => {
      req.body = {
        name: 'Product',
        sku: 'TEST-001',
        price: '100',
        stockQuantity: '5',
        category: 'invalid-category'
      };

      Product.findOne.mockResolvedValue(null); // SKU check passes
      Category.findById.mockResolvedValue(null); // Category not found

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid category ID'
      });
    });
  });

  describe('updateProduct', () => {
    test('should update product successfully', async () => {
      const existingProduct = {
        _id: 'product123',
        name: 'Old Product',
        sku: 'OLD-001',
        price: 100,
        stockQuantity: 5,
        tags: ['old'],
        condition: 'new',
        status: 'active'
      };

      const updateData = {
        name: 'Updated Product',
        sku: 'OLD-001', // Same SKU
        price: '120',
        stockQuantity: '8'
      };

      req.params.productId = 'product123';
      req.body = updateData;

      Product.findById.mockResolvedValue(existingProduct);
      Product.findOne.mockResolvedValue(null); // No duplicate SKU
      
      const updatedProduct = { ...existingProduct, ...updateData, price: 120, stockQuantity: 8 };
      const mockPopulatedProduct = {
        ...updatedProduct,
        populate: vi.fn().mockReturnValue(updatedProduct)
      };
      
      Product.findByIdAndUpdate.mockReturnValue(mockPopulatedProduct);

      await updateProduct(req, res);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        'product123',
        expect.objectContaining({
          name: 'Updated Product',
          price: 120,
          stockQuantity: 8
        }),
        { new: true, runValidators: true }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product updated successfully',
        data: { product: updatedProduct }
      });
    });

    test('should return 404 for non-existent product', async () => {
      req.params.productId = 'nonexistent';
      req.body = { name: 'Test', sku: 'TEST', price: '100', stockQuantity: '5' };

      Product.findById.mockResolvedValue(null);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.params.productId = 'product123';
      req.body = { name: 'Product' }; // Missing SKU, price, stockQuantity

      Product.findById.mockResolvedValue({ _id: 'product123' });

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name, SKU, price, and stock quantity are required'
      });
    });

    test('should handle SKU uniqueness when changing SKU', async () => {
      const existingProduct = {
        _id: 'product123',
        sku: 'OLD-001'
      };

      req.params.productId = 'product123';
      req.body = {
        name: 'Product',
        sku: 'EXISTING-002', // Different SKU
        price: '100',
        stockQuantity: '5'
      };

      Product.findById.mockResolvedValue(existingProduct);
      // Mock that another product already has the new SKU
      Product.findOne.mockResolvedValue({ _id: 'other123', sku: 'EXISTING-002' });

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'SKU already exists. Please use a unique SKU.'
      });
    });
  });
});