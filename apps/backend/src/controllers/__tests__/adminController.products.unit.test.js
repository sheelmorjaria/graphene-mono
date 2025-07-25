import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the Product model
vi.mock('../../models/Product.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn()
  }
}));

// Import the function to test after mocking
import { getProducts } from '../adminController.js';
import Product from '../../models/Product.js';

describe('Admin Controller - getProducts Unit Tests', () => {
  let req, res, mockQuery;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      query: {}
    };
    
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    // Create mock query object for each test
    mockQuery = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([])
    };

    // Reset mocks
    Product.find.mockReturnValue(mockQuery);
    Product.countDocuments.mockResolvedValue(0);
  });

  test('should handle empty query parameters', async () => {
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({ status: { $ne: 'archived' } });
    expect(Product.countDocuments).toHaveBeenCalledWith({ status: { $ne: 'archived' } });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  });

  test('should build search query correctly', async () => {
    req.query.searchQuery = 'pixel';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'pixel', $options: 'i' } },
        { sku: { $regex: 'pixel', $options: 'i' } }
      ],
      status: { $ne: 'archived' }
    });
  });

  test('should apply category filter', async () => {
    req.query.category = 'smartphone';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      category: 'smartphone',
      status: { $ne: 'archived' }
    });
  });

  test('should apply status filter', async () => {
    req.query.status = 'active';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      status: 'active'
    });
  });

  test('should apply price range filters', async () => {
    req.query.minPrice = '100';
    req.query.maxPrice = '500';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      price: { $gte: 100, $lte: 500 },
      status: { $ne: 'archived' }
    });
  });

  test('should apply minimum price filter only', async () => {
    req.query.minPrice = '100';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      price: { $gte: 100 },
      status: { $ne: 'archived' }
    });
  });

  test('should apply maximum price filter only', async () => {
    req.query.maxPrice = '500';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      price: { $lte: 500 },
      status: { $ne: 'archived' }
    });
  });

  test('should apply in_stock filter', async () => {
    req.query.stockStatus = 'in_stock';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      stockQuantity: { $gt: 0 },
      status: { $ne: 'archived' }
    });
  });

  test('should apply out_of_stock filter', async () => {
    req.query.stockStatus = 'out_of_stock';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      stockQuantity: 0,
      status: { $ne: 'archived' }
    });
  });

  test('should apply low_stock filter', async () => {
    req.query.stockStatus = 'low_stock';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      stockQuantity: { $gt: 0, $lte: 10 },
      status: { $ne: 'archived' }
    });
  });

  test('should apply sorting ascending', async () => {
    req.query.sortBy = 'price';
    req.query.sortOrder = 'asc';
    
    await getProducts(req, res);

    expect(mockQuery.sort).toHaveBeenCalledWith({ price: 1 });
  });

  test('should apply sorting descending', async () => {
    req.query.sortBy = 'name';
    req.query.sortOrder = 'desc';
    
    await getProducts(req, res);

    expect(mockQuery.sort).toHaveBeenCalledWith({ name: -1 });
  });

  test('should apply default sorting', async () => {
    await getProducts(req, res);

    expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  test('should apply pagination correctly', async () => {
    req.query.page = '3';
    req.query.limit = '5';
    
    await getProducts(req, res);

    expect(mockQuery.skip).toHaveBeenCalledWith(10); // (3-1) * 5
    expect(mockQuery.limit).toHaveBeenCalledWith(5);
  });

  test('should select correct fields', async () => {
    await getProducts(req, res);

    expect(mockQuery.select).toHaveBeenCalledWith(
      'name sku price stockQuantity status category images createdAt updatedAt'
    );
  });

  test('should calculate pagination metadata correctly', async () => {
    req.query.page = '2';
    req.query.limit = '5';
    Product.countDocuments.mockResolvedValue(12);
    
    await getProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        products: [],
        pagination: {
          currentPage: 2,
          totalPages: 3, // Math.ceil(12/5)
          totalItems: 12,
          itemsPerPage: 5,
          hasNextPage: true, // page 2 < 3
          hasPrevPage: true // page 2 > 1
        }
      }
    });
  });

  test('should handle multiple filters combined', async () => {
    req.query.searchQuery = 'pixel';
    req.query.category = 'smartphone';
    req.query.status = 'active';
    req.query.minPrice = '500';
    req.query.stockStatus = 'in_stock';
    
    await getProducts(req, res);

    expect(Product.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'pixel', $options: 'i' } },
        { sku: { $regex: 'pixel', $options: 'i' } }
      ],
      category: 'smartphone',
      status: 'active',
      price: { $gte: 500 },
      stockQuantity: { $gt: 0 }
    });
  });

  test('should handle database errors gracefully', async () => {
    const errorMessage = 'Database connection failed';
    Product.find.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server error while fetching products'
    });
  });

  test('should return products when found', async () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Test Product',
        sku: 'TEST-001',
        price: 100,
        stockQuantity: 10,
        status: 'active',
        category: 'test',
        images: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockQuery.lean.mockResolvedValue(mockProducts);
    Product.countDocuments.mockResolvedValue(1);
    
    await getProducts(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        products: mockProducts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
          itemsPerPage: 10,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    });
  });
});