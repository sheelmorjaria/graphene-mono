import { vi, describe, test, beforeEach, expect } from 'vitest';

// Make mongoose.Types.ObjectId.isValid use a strict 24-hex regex so the
// controller's ID validation behaves like real Mongoose (the global setup.vitest
// mock returns true for everything).
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  const isValid = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  const Types = {
    ...(actual.Types || {}),
    ObjectId: Object.assign(
      vi.fn((id) => id),
      { isValid, createFromHexString: vi.fn((s) => s) }
    )
  };
  return {
    ...actual,
    default: { ...(actual.default || {}), Types },
    Types
  };
});

// Mock csv-writer (used by exportProductsToCSV)
vi.mock('csv-writer', () => ({
  createObjectCsvStringifier: vi.fn().mockReturnValue({
    getHeaderString: vi.fn().mockReturnValue('HEADER'),
    stringifyRecords: vi.fn().mockReturnValue('BODY')
  })
}));

// Mock the Product model — constructor plus static methods
vi.mock('../../models/Product.js', () => {
  const ProductMock = vi.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(this);
    this.toObject = vi.fn().mockReturnValue({ ...data });
    this.populate = vi.fn().mockResolvedValue(this);
    // instance methods used by getProductById / getProducts
    this.getPriceRange = vi.fn().mockReturnValue({ min: 100, max: 200 });
    this.getTotalStock = vi.fn().mockReturnValue(10);
    this.getAvailableColors = vi.fn().mockReturnValue(['Black']);
    this.getAvailableConditions = vi.fn().mockReturnValue(['new']);
    this.softDelete = vi.fn().mockResolvedValue(this);
    return this;
  });

  ProductMock.find = vi.fn();
  ProductMock.findById = vi.fn();
  ProductMock.findOne = vi.fn();
  ProductMock.countDocuments = vi.fn();

  return { default: ProductMock };
});

// Mock the Category model
vi.mock('../../models/Category.js', () => ({
  default: {
    findById: vi.fn()
  }
}));

import {
  createProduct,
  updateProduct,
  getProductById,
  getProducts,
  deleteProduct,
  updateVariationStock,
  exportProductsToCSV
} from '../adminProductController.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';
import { createObjectCsvStringifier } from 'csv-writer';

// A valid 24-char ObjectId so mongoose.Types.ObjectId.isValid passes
const VALID_ID = '507f1f77bcf86cd799439011';

// Helper to build a valid variation with phone fields
const makeVariation = (overrides = {}) => ({
  price: '100',
  sku: 'PIXEL-8-128-BLK',
  condition: 'new',
  color: 'Black',
  storage: '128GB',
  stockQuantity: '5',
  ...overrides
});

describe('adminProductController - unit tests', () => {
  let req, res;

  beforeEach(() => {
    vi.clearAllMocks();

    req = { params: {}, body: {}, query: {} };
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
      setHeader: vi.fn()
    };

    // Reset csv-writer mock to default behaviour
    createObjectCsvStringifier.mockReturnValue({
      getHeaderString: vi.fn().mockReturnValue('HEADER'),
      stringifyRecords: vi.fn().mockReturnValue('BODY')
    });
  });

  // ---------------------------------------------------------------------------
  // createProduct
  // ---------------------------------------------------------------------------
  describe('createProduct', () => {
    test('happy path: creates product with variations', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: [makeVariation()],
        category: 'cat123'
      };

      // Variation SKU check -> none exists
      Product.findOne.mockResolvedValue(null); // SKU + slug + product-SKU checks all pass
      Category.findById.mockResolvedValue({ _id: 'cat123', name: 'Phones' });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product created successfully'
        })
      );
    });

    test('parses variations passed as a JSON string (FormData)', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: JSON.stringify([makeVariation()])
      };
      Product.findOne.mockResolvedValue(null);

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('returns 400 for invalid variations JSON string', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: '{not valid json'
      };

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid variations JSON format'
      });
    });

    test('returns 400 when required fields missing (no name/baseModel/variations)', async () => {
      req.body = { name: 'Pixel 8' };

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name, base model, and at least one variation are required'
      });
    });

    test('returns 400 when variations is an empty array', async () => {
      req.body = { name: 'Pixel 8', baseModel: 'Pixel 8', variations: [] };

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name, base model, and at least one variation are required'
      });
    });

    test('returns 400 when a variation is missing price or SKU', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: [makeVariation({ price: undefined, sku: undefined })]
      };

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Each variation must have price and SKU'
      });
    });

    test('returns 400 when a variation is missing condition or color', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: [makeVariation({ condition: undefined, color: undefined })]
      };

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Each variation must have condition and color'
      });
    });

    test('returns 400 when a variation SKU already exists', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: [makeVariation()]
      };
      Product.findOne.mockResolvedValue({ _id: 'existing', variations: [{ sku: 'PIXEL-8-128-BLK' }] });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'SKU PIXEL-8-128-BLK already exists'
      });
    });

    test('returns 400 when provided category does not exist', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: [makeVariation()],
        category: 'bogus-cat'
      };
      Product.findOne.mockResolvedValue(null); // SKU check passes
      Category.findById.mockResolvedValue(null);

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid category ID'
      });
    });

    test('returns 500 when save throws', async () => {
      req.body = {
        name: 'Pixel 8',
        baseModel: 'Pixel 8',
        variations: [makeVariation()]
      };
      Product.findOne.mockResolvedValue(null);
      const err = new Error('DB boom');
      Product.mockImplementation(function () {
        this.save = vi.fn().mockRejectedValue(err);
        return this;
      });

      await createProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'DB boom'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateProduct
  // ---------------------------------------------------------------------------
  describe('updateProduct', () => {
    // Build a fresh existing product each time — the controller mutates it
    // (rebuilds variations array), so we cannot share one instance.
    const buildExistingProduct = () => ({
      _id: VALID_ID,
      name: 'Old',
      baseModel: 'Pixel 8',
      slug: 'pixel-8',
      status: 'active',
      variations: [
        {
          _id: 'var1',
          price: 100,
          sku: 'PIXEL-8-128-BLK',
          condition: 'new',
          color: 'Black',
          storage: '128GB',
          stockQuantity: 5,
          stockStatus: 'in_stock',
          images: []
        }
      ],
      save: vi.fn().mockResolvedValue(),
      populate: vi.fn().mockResolvedValue()
    });

    test('happy path: updates product fields and variations', async () => {
      req.params = { productId: VALID_ID };
      req.body = {
        name: 'Pixel 8 Pro',
        baseModel: 'Pixel 8 Pro',
        variations: [
          { _id: 'var1', price: '150', sku: 'PIXEL-8-128-BLK', condition: 'new', color: 'Black' }
        ]
      };

      const existingProduct = buildExistingProduct();
      Product.findById.mockResolvedValue(existingProduct);
      Product.findOne.mockResolvedValue(null); // SKU uniqueness OK

      await updateProduct(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Product updated successfully'
        })
      );
      expect(existingProduct.save).toHaveBeenCalled();
    });

    test('returns 400 for invalid product ID', async () => {
      req.params = { productId: 'not-an-objectid' };
      req.body = { name: 'X', baseModel: 'X', variations: [makeVariation()] };

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID'
      });
    });

    test('returns 404 when product not found', async () => {
      req.params = { productId: VALID_ID };
      req.body = { name: 'X', baseModel: 'X', variations: [makeVariation()] };
      Product.findById.mockResolvedValue(null);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    test('returns 400 when required fields missing', async () => {
      req.params = { productId: VALID_ID };
      req.body = { name: 'X' }; // no baseModel/variations
      Product.findById.mockResolvedValue(buildExistingProduct());

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Name, base model, and at least one variation are required'
      });
    });

    test('returns 400 when variation missing price/SKU and none in existing', async () => {
      req.params = { productId: VALID_ID };
      const base = buildExistingProduct();
      const noSkuProduct = {
        ...base,
        variations: [{ _id: 'var1' }] // no sku/price
      };
      req.body = {
        name: 'Pixel 8 Pro',
        baseModel: 'Pixel 8 Pro',
        variations: [{ _id: 'var1' }] // no sku/price supplied either
      };
      Product.findById.mockResolvedValue(noSkuProduct);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Each variation must have price and SKU'
      });
    });

    test('returns 400 when variation SKU exists in another product', async () => {
      req.params = { productId: VALID_ID };
      req.body = {
        name: 'Pixel 8 Pro',
        baseModel: 'Pixel 8 Pro',
        variations: [
          { _id: 'var1', price: '150', sku: 'TAKEN-SKU', condition: 'new', color: 'Black' }
        ]
      };
      Product.findById.mockResolvedValue(buildExistingProduct());
      Product.findOne.mockResolvedValue({ _id: 'other' }); // duplicate SKU elsewhere

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'SKU TAKEN-SKU already exists in another product'
      });
    });

    test('returns 400 when category does not exist', async () => {
      req.params = { productId: VALID_ID };
      req.body = {
        name: 'Pixel 8 Pro',
        baseModel: 'Pixel 8 Pro',
        variations: [
          { _id: 'var1', price: '150', sku: 'PIXEL-8-128-BLK', condition: 'new', color: 'Black' }
        ],
        category: 'bad-cat'
      };
      Product.findById.mockResolvedValue(buildExistingProduct());
      Product.findOne.mockResolvedValue(null); // SKU OK
      Category.findById.mockResolvedValue(null);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid category ID'
      });
    });

    test('returns 400 when slug already used by another product', async () => {
      req.params = { productId: VALID_ID };
      req.body = {
        name: 'Pixel 8 Pro',
        baseModel: 'Pixel 8 Pro',
        slug: 'taken-slug',
        variations: [
          { _id: 'var1', price: '150', sku: 'PIXEL-8-128-BLK', condition: 'new', color: 'Black' }
        ]
      };
      Product.findById.mockResolvedValue(buildExistingProduct());
      // Variation SKU check -> no duplicate; then slug check -> duplicate
      Product.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: 'other' });

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Slug already exists. Please use a unique slug.'
      });
    });

    test('returns 500 when save throws', async () => {
      req.params = { productId: VALID_ID };
      req.body = {
        name: 'Pixel 8 Pro',
        baseModel: 'Pixel 8 Pro',
        variations: [
          { _id: 'var1', price: '150', sku: 'PIXEL-8-128-BLK', condition: 'new', color: 'Black' }
        ]
      };
      const failingProduct = {
        ...buildExistingProduct(),
        save: vi.fn().mockRejectedValue(new Error('save failed')),
        populate: vi.fn().mockResolvedValue()
      };
      Product.findById.mockResolvedValue(failingProduct);
      Product.findOne.mockResolvedValue(null);

      await updateProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'save failed'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getProductById
  // ---------------------------------------------------------------------------
  describe('getProductById', () => {
    test('happy path: returns product with computed fields', async () => {
      const product = {
        _id: VALID_ID,
        name: 'Pixel 8',
        toObject: vi.fn().mockReturnValue({ _id: VALID_ID, name: 'Pixel 8' }),
        getPriceRange: vi.fn().mockReturnValue({ min: 100, max: 200 }),
        getTotalStock: vi.fn().mockReturnValue(10),
        getAvailableColors: vi.fn().mockReturnValue(['Black']),
        getAvailableConditions: vi.fn().mockReturnValue(['new'])
      };
      const populateChain = { populate: vi.fn().mockResolvedValue(product) };
      Product.findById.mockReturnValue(populateChain);
      req.params = { productId: VALID_ID };

      await getProductById(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: VALID_ID,
            priceRange: { min: 100, max: 200 },
            totalStock: 10
          })
        })
      );
    });

    test('returns 400 for invalid product ID', async () => {
      req.params = { productId: 'bad' };

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID'
      });
    });

    test('returns 404 when product not found', async () => {
      const populateChain = { populate: vi.fn().mockResolvedValue(null) };
      Product.findById.mockReturnValue(populateChain);
      req.params = { productId: VALID_ID };

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    test('returns 500 when an error is thrown', async () => {
      Product.findById.mockImplementation(() => {
        throw new Error('boom');
      });
      req.params = { productId: VALID_ID };

      await getProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching product'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getProducts
  // ---------------------------------------------------------------------------
  describe('getProducts', () => {
    const buildProduct = () => ({
      _id: 'p1',
      name: 'Pixel 8',
      variations: [{ sku: 'X' }],
      toObject: vi.fn().mockReturnValue({ _id: 'p1', name: 'Pixel 8' }),
      getPriceRange: vi.fn().mockReturnValue({ min: 1, max: 2 }),
      getTotalStock: vi.fn().mockReturnValue(3)
    });

    const chainFrom = (products) => ({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(products)
    });

    test('happy path: returns paginated products', async () => {
      const products = [buildProduct()];
      Product.find.mockReturnValue(chainFrom(products));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { page: '1', limit: '10' };

      await getProducts(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            products: expect.any(Array),
            pagination: expect.objectContaining({ total: 1 })
          })
        })
      );
    });

    test('builds search/category/status filters', async () => {
      const products = [buildProduct()];
      Product.find.mockReturnValue(chainFrom(products));
      Product.countDocuments.mockResolvedValue(1);
      req.query = { search: 'pixel', category: 'cat1', status: 'active' };

      await getProducts(req, res);

      // find should be called with a filter object containing $or/category/status
      expect(Product.find).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'cat1',
          status: 'active',
          $or: expect.any(Array)
        })
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    test('returns 500 when find throws', async () => {
      Product.find.mockImplementation(() => {
        throw new Error('find failed');
      });
      Product.countDocuments.mockResolvedValue(0);

      await getProducts(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while fetching products'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteProduct
  // ---------------------------------------------------------------------------
  describe('deleteProduct', () => {
    test('happy path: soft deletes product', async () => {
      const product = { softDelete: vi.fn().mockResolvedValue() };
      Product.findById.mockResolvedValue(product);
      req.params = { productId: VALID_ID };

      await deleteProduct(req, res);

      expect(product.softDelete).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully'
      });
    });

    test('returns 400 for invalid product ID', async () => {
      req.params = { productId: 'bad' };

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID'
      });
    });

    test('returns 404 when product not found', async () => {
      Product.findById.mockResolvedValue(null);
      req.params = { productId: VALID_ID };

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    test('returns 500 when softDelete throws', async () => {
      const product = { softDelete: vi.fn().mockRejectedValue(new Error('nope')) };
      Product.findById.mockResolvedValue(product);
      req.params = { productId: VALID_ID };

      await deleteProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while deleting product'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateVariationStock
  // ---------------------------------------------------------------------------
  describe('updateVariationStock', () => {
    const variation = { _id: 'var1', stockQuantity: 5, stockStatus: 'in_stock' };
    const product = {
      _id: VALID_ID,
      variations: { id: vi.fn().mockReturnValue(variation) },
      save: vi.fn().mockResolvedValue()
    };

    test('happy path: updates variation stock', async () => {
      Product.findById.mockResolvedValue(product);
      req.params = { productId: VALID_ID };
      req.body = { variationId: 'var1', stockQuantity: '20', stockStatus: 'low_stock' };

      await updateVariationStock(req, res);

      expect(variation.stockQuantity).toBe(20);
      expect(variation.stockStatus).toBe('low_stock');
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Variation stock updated successfully',
          data: variation
        })
      );
    });

    test('returns 400 for invalid product ID', async () => {
      req.params = { productId: 'bad' };

      await updateVariationStock(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid product ID'
      });
    });

    test('returns 404 when product not found', async () => {
      Product.findById.mockResolvedValue(null);
      req.params = { productId: VALID_ID };
      req.body = { variationId: 'var1' };

      await updateVariationStock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Product not found'
      });
    });

    test('returns 404 when variation not found', async () => {
      const noVarProduct = {
        _id: VALID_ID,
        variations: { id: vi.fn().mockReturnValue(null) },
        save: vi.fn()
      };
      Product.findById.mockResolvedValue(noVarProduct);
      req.params = { productId: VALID_ID };
      req.body = { variationId: 'missing' };

      await updateVariationStock(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Variation not found'
      });
    });

    test('returns 500 when save throws', async () => {
      const failingProduct = {
        _id: VALID_ID,
        variations: { id: vi.fn().mockReturnValue(variation) },
        save: vi.fn().mockRejectedValue(new Error('save fail'))
      };
      Product.findById.mockResolvedValue(failingProduct);
      req.params = { productId: VALID_ID };
      req.body = { variationId: 'var1', stockQuantity: '1' };

      await updateVariationStock(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while updating stock'
      });
    });
  });

  // ---------------------------------------------------------------------------
  // exportProductsToCSV
  // ---------------------------------------------------------------------------
  describe('exportProductsToCSV', () => {
    test('happy path: exports products with variations to CSV', async () => {
      const products = [
        {
          _id: { toString: () => VALID_ID },
          name: 'Pixel 8',
          slug: 'pixel-8',
          sku: 'PIXEL8',
          shortDescription: 'desc',
          longDescription: 'long',
          baseModel: 'Pixel 8',
          category: { _id: { toString: () => 'cat1' }, name: 'Phones' },
          tags: ['a', 'b'],
          images: ['img1'],
          status: 'active',
          isActive: true,
          weight: 200,
          leadTime: { minDays: 3, maxDays: 5, displayText: '3-5 days' },
          dimensions: { length: 10, width: 5, height: 2 },
          attributes: [{ name: 'RAM', value: '8GB' }],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02'),
          variations: [
            { condition: 'new', color: 'Black', storage: '128GB', price: 100, stockQuantity: 5, stockStatus: 'in_stock', sku: 'V1', images: ['vi1'] }
          ]
        }
      ];
      Product.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(products)
      });

      await exportProductsToCSV(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalledWith('HEADERBODY');
    });

    test('handles products without variations', async () => {
      const products = [
        {
          _id: { toString: () => VALID_ID },
          name: 'Pixel 8',
          slug: 'pixel-8',
          sku: 'PIXEL8',
          baseModel: 'Pixel 8',
          category: null,
          tags: [],
          images: [],
          status: 'draft',
          isActive: false,
          variations: []
        }
      ];
      Product.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockResolvedValue(products)
      });

      await exportProductsToCSV(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.send).toHaveBeenCalledWith('HEADERBODY');
    });

    test('returns 500 when find throws', async () => {
      Product.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockRejectedValue(new Error('db down'))
      });

      await exportProductsToCSV(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Server error occurred while exporting products'
      });
    });
  });
});
