import { vi, describe, test, beforeEach, expect } from 'vitest';

// Mock the Product model
vi.mock('../../models/Product.js', () => ({
  default: Object.assign(vi.fn(), {
    findOne: vi.fn()
  })
}));

import { getProductBySlug } from '../productDetailsController.js';
import Product from '../../models/Product.js';

// Build a product with the instance methods the controller calls
const makeProduct = (overrides = {}) => ({
  _id: 'p1',
  name: 'Google Pixel 8 Pro',
  slug: 'google-pixel-8-pro',
  shortDescription: 'A great phone',
  longDescription: 'Long description',
  baseModel: 'Pixel 8',
  images: ['/img.png'],
  category: { name: 'Phones', slug: 'phones' },
  variations: [
    {
      _id: 'v1', condition: 'new', color: 'black', storage: '128GB', variantName: 'Pixel 8 Pro 128GB',
      price: 899, salePrice: 799, stockStatus: 'in_stock', stockQuantity: 5, sku: 'SKU1', images: ['/v.png']
    }
  ],
  attributes: { brand: 'Google' },
  weight: 0.2,
  leadTime: 2,
  dimensions: { length: 15, width: 7, height: 1 },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  getPriceRange: vi.fn().mockReturnValue({ min: 799, max: 899 }),
  getAvailableColors: vi.fn().mockReturnValue(['black']),
  getAvailableConditions: vi.fn().mockReturnValue(['new']),
  getAvailableStorage: vi.fn().mockReturnValue(['128GB']),
  isInStock: vi.fn().mockReturnValue(true),
  getTotalStock: vi.fn().mockReturnValue(5),
  ...overrides
});

// Chainable populate query terminating at await (thenable)
const chainablePopulate = (data) => ({
  populate: vi.fn().mockResolvedValue(data)
});

describe('Product Details Controller - Coverage Gap Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { params: {} };
    res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  });

  describe('getProductBySlug', () => {
    test('happy path: returns formatted product details', async () => {
      const product = makeProduct();
      Product.findOne.mockReturnValue(chainablePopulate(product));
      req.params.slug = 'google-pixel-8-pro';

      await getProductBySlug(req, res);

      expect(Product.findOne).toHaveBeenCalledWith({ slug: 'google-pixel-8-pro', isActive: true });
      const call = res.json.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data).toEqual(expect.objectContaining({
        _id: 'p1',
        name: 'Google Pixel 8 Pro',
        slug: 'google-pixel-8-pro',
        baseModel: 'Pixel 8',
        priceRange: { min: 799, max: 899 },
        availableColors: ['black'],
        availableConditions: ['new'],
        availableStorage: ['128GB'],
        isInStock: true,
        totalStock: 5,
        weight: 0.2,
        leadTime: 2,
        isActive: true
      }));
      // variations are mapped to a subset of fields
      expect(call.data.variations[0]).toEqual(expect.objectContaining({
        _id: 'v1', condition: 'new', color: 'black', storage: '128GB',
        price: 899, salePrice: 799, stockStatus: 'in_stock', stockQuantity: 5, sku: 'SKU1'
      }));
    });

    test('returns 404 when product not found', async () => {
      Product.findOne.mockReturnValue(chainablePopulate(null));
      req.params.slug = 'missing-slug';
      await getProductBySlug(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Product not found' });
    });

    test('error: returns 500 on failure', async () => {
      Product.findOne.mockReturnValue({ populate: vi.fn().mockRejectedValue(new Error('boom')) });
      req.params.slug = 'some-slug';
      await getProductBySlug(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal server error' });
    });
  });
});
