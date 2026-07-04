import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the Product model
vi.mock('../../models/Product.js', () => {
  const Product = Object.assign(vi.fn(), {
    find: vi.fn(),
    findOne: vi.fn(),
    countDocuments: vi.fn()
  });
  return { default: Product };
});

import { searchProducts } from '../searchController.js';
import Product from '../../models/Product.js';

// Build a fully chainable query terminating in .exec()
const chainable = (data) => ({
  populate: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  exec: vi.fn().mockResolvedValue(data)
});

// Build a product with variation data used by the formatter
const makeProduct = (overrides = {}) => ({
  _id: 'p1',
  name: 'Google Pixel 8 Pro',
  slug: 'google-pixel-8-pro',
  baseModel: 'Pixel 8',
  shortDescription: 'A great phone',
  images: ['/img.png'],
  category: { name: 'Phones', slug: 'phones' },
  createdAt: new Date(),
  variations: [
    { condition: 'new', salePrice: 799, price: 899, stockStatus: 'in_stock', stockQuantity: 5 },
    { condition: 'good', salePrice: 599, price: 699, stockStatus: 'out_of_stock', stockQuantity: 0 }
  ],
  ...overrides
});

describe('Search Controller - Coverage Gap Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { query: {} };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  });

  describe('searchProducts', () => {
    test('400 when query missing', async () => {
      req.query = {};
      await searchProducts(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Search query is required' });
    });

    test('400 when query is whitespace', async () => {
      req.query = { q: '   ' };
      await searchProducts(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('happy path: text search succeeds with single-word query', async () => {
      const product = makeProduct();
      Product.findOne.mockResolvedValue(product); // text-search availability probe succeeds
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel' };

      await searchProducts(req, res);

      // text-search filter was built (no exception thrown)
      expect(Product.findOne).toHaveBeenCalled();
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.products).toHaveLength(1);
      expect(call.data.products[0]).toEqual(expect.objectContaining({
        id: 'p1',
        name: 'Google Pixel 8 Pro',
        price: 599, // min of salePrice 799/599
        isInStock: true,
        stockStatus: 'in_stock'
      }));
      expect(res.status).not.toHaveBeenCalledWith(400);
    });

    test('happy path: multi-word query uses phrase text search', async () => {
      const product = makeProduct();
      Product.findOne.mockResolvedValue(product);
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel 8 pro' };

      await searchProducts(req, res);

      const filter = Product.findOne.mock.calls[0][0];
      const textClause = filter.$and.find((c) => c.$text);
      expect(textClause).toBeDefined();
      expect(textClause.$text.$search).toBe('"pixel 8 pro"');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('happy path: applies category, condition, price filters and sort', async () => {
      const product = makeProduct();
      Product.findOne.mockResolvedValue(product);
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = {
        q: 'pixel',
        category: 'phones',
        condition: 'new',
        minPrice: '100',
        maxPrice: '1000',
        sortBy: 'price',
        sortOrder: 'asc'
      };

      await searchProducts(req, res);

      const filter = Product.findOne.mock.calls[0][0];
      const andClauses = filter.$and;
      expect(andClauses.some(c => c.category === 'phones')).toBe(true);
      expect(andClauses.some(c => c['variations.condition'] === 'new')).toBe(true);
      expect(andClauses.some(c => c['variations.price'] && c['variations.price'].$gte === 100)).toBe(true);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('falls back to regex search when text probe throws (single word)', async () => {
      const product = makeProduct();
      // First call (text-search probe) throws to force the catch block fallback
      Product.findOne.mockRejectedValueOnce(new Error('text index missing'));
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'foldable' };

      await searchProducts(req, res);

      const fallbackFilter = Product.find.mock.calls[0][0];
      expect(fallbackFilter.$and).toBeDefined();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('falls back to regex search with multi-word query', async () => {
      const product = makeProduct();
      Product.findOne.mockRejectedValueOnce(new Error('text index missing'));
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel fold' };

      await searchProducts(req, res);

      const fallbackFilter = Product.find.mock.calls[0][0];
      // multi-word: $and has isActive + per-word $or clauses
      expect(fallbackFilter.$and.length).toBeGreaterThanOrEqual(2);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('falls back with explicit sortBy=createdAt and sortOrder=asc', async () => {
      const product = makeProduct();
      Product.findOne.mockRejectedValueOnce(new Error('text index missing'));
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel', sortBy: 'createdAt', sortOrder: 'asc' };

      await searchProducts(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('falls back to default sort for unknown sortBy in fallback path', async () => {
      const product = makeProduct();
      Product.findOne.mockRejectedValueOnce(new Error('text index missing'));
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel', sortBy: 'relevance' };

      await searchProducts(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('formats product as out_of_stock when all variations out of stock', async () => {
      const product = makeProduct({
        variations: [{ condition: 'good', salePrice: 100, stockStatus: 'out_of_stock', stockQuantity: 0 }]
      });
      Product.findOne.mockResolvedValue(product);
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel' };

      await searchProducts(req, res);

      const formatted = res.json.mock.calls[0][0].data.products[0];
      expect(formatted.isInStock).toBe(false);
      expect(formatted.stockStatus).toBe('out_of_stock');
    });

    test('handles product with no variations', async () => {
      const product = makeProduct({ variations: [] });
      Product.findOne.mockResolvedValue(product);
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel' };

      await searchProducts(req, res);

      const formatted = res.json.mock.calls[0][0].data.products[0];
      expect(formatted.price).toBe(0);
      expect(formatted.priceRange).toBe(null);
    });

    test('priceRange is null when min and max are equal', async () => {
      const product = makeProduct({
        variations: [
          { condition: 'new', salePrice: 500, stockStatus: 'in_stock', stockQuantity: 2 },
          { condition: 'good', salePrice: 500, stockStatus: 'in_stock', stockQuantity: 1 }
        ]
      });
      Product.findOne.mockResolvedValue(product);
      Product.find.mockReturnValue(chainable([product]));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { q: 'pixel' };

      await searchProducts(req, res);

      const formatted = res.json.mock.calls[0][0].data.products[0];
      expect(formatted.priceRange).toBe(null);
    });

    test('error: returns 500 when find query fails', async () => {
      Product.findOne.mockResolvedValue({ _id: 'p1' });
      const failingExec = vi.fn().mockRejectedValue(new Error('boom'));
      Product.find.mockReturnValue({
        populate: () => ({ select: () => ({ sort: () => ({ skip: () => ({ limit: () => ({ exec: failingExec }) }) }) }) })
      });
      Product.countDocuments.mockResolvedValue(0);
      req.query = { q: 'pixel' };

      await searchProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Internal server error' });
    });
  });
});
