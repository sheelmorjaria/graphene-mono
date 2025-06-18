import { describe, it, expect } from 'vitest';
import { validationResult } from 'express-validator';
import { 
  createProductValidation, 
  updateProductValidation, 
  getProductsValidation 
} from '../productValidators.js';

// Helper function to run validation
const runValidation = async (validations, req) => {
  await Promise.all(validations.map(validation => validation.run(req)));
  return validationResult(req);
};

// Mock request object helper
const createMockReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query
});

describe('Product Validators', () => {
  describe('createProductValidation', () => {
    const validProductData = {
      name: 'Google Pixel 8 Pro',
      description: 'Latest Google Pixel 8 Pro with GrapheneOS pre-installed for maximum privacy and security.',
      price: 899.99,
      sku: 'PIXEL8PRO-128GB',
      category: '507f1f77bcf86cd799439011'
    };

    it('should pass validation with valid product data', async () => {
      const req = createMockReq(validProductData);
      const result = await runValidation(createProductValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    describe('Name Validation', () => {
      it('should fail when name is empty', async () => {
        const req = createMockReq({
          ...validProductData,
          name: ''
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Product name is required'
            })
          ])
        );
      });

      it('should fail when name is too short', async () => {
        const req = createMockReq({
          ...validProductData,
          name: 'ab'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Product name must be between 3 and 200 characters'
            })
          ])
        );
      });

      it('should fail when name is too long', async () => {
        const req = createMockReq({
          ...validProductData,
          name: 'a'.repeat(201)
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Product name must be between 3 and 200 characters'
            })
          ])
        );
      });

      it('should pass with minimum length name', async () => {
        const req = createMockReq({
          ...validProductData,
          name: 'abc'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with maximum length name', async () => {
        const req = createMockReq({
          ...validProductData,
          name: 'a'.repeat(200)
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should trim whitespace from name', async () => {
        const req = createMockReq({
          ...validProductData,
          name: '  Google Pixel 8  '
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });

    describe('Description Validation', () => {
      it('should fail when description is empty', async () => {
        const req = createMockReq({
          ...validProductData,
          description: ''
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Product description is required'
            })
          ])
        );
      });

      it('should fail when description is too short', async () => {
        const req = createMockReq({
          ...validProductData,
          description: 'short'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Description must be between 10 and 5000 characters'
            })
          ])
        );
      });

      it('should fail when description is too long', async () => {
        const req = createMockReq({
          ...validProductData,
          description: 'a'.repeat(5001)
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Description must be between 10 and 5000 characters'
            })
          ])
        );
      });

      it('should pass with minimum length description', async () => {
        const req = createMockReq({
          ...validProductData,
          description: 'a'.repeat(10)
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with maximum length description', async () => {
        const req = createMockReq({
          ...validProductData,
          description: 'a'.repeat(5000)
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });

    describe('Price Validation', () => {
      it('should fail with negative price', async () => {
        const req = createMockReq({
          ...validProductData,
          price: -10
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Price must be greater than 0'
            })
          ])
        );
      });

      it('should fail with zero price', async () => {
        const req = createMockReq({
          ...validProductData,
          price: 0
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Price must be greater than 0'
            })
          ])
        );
      });

      it('should pass with minimum valid price', async () => {
        const req = createMockReq({
          ...validProductData,
          price: 0.01
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with high price', async () => {
        const req = createMockReq({
          ...validProductData,
          price: 9999.99
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should fail with non-numeric price', async () => {
        const req = createMockReq({
          ...validProductData,
          price: 'not-a-number'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
      });
    });

    describe('SKU Validation', () => {
      it('should fail when SKU is empty', async () => {
        const req = createMockReq({
          ...validProductData,
          sku: ''
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'SKU is required'
            })
          ])
        );
      });

      it('should fail with invalid SKU characters', async () => {
        const req = createMockReq({
          ...validProductData,
          sku: 'PIXEL8@PRO'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'SKU can only contain letters, numbers, and hyphens'
            })
          ])
        );
      });

      it('should pass with valid SKU formats', async () => {
        const validSKUs = ['PIXEL8PRO', 'PIXEL-8-PRO', '12345', 'ABC-123-XYZ'];
        
        for (const sku of validSKUs) {
          const req = createMockReq({
            ...validProductData,
            sku
          });
          const result = await runValidation(createProductValidation, req);
          
          expect(result.isEmpty()).toBe(true);
        }
      });

      it('should trim whitespace from SKU', async () => {
        const req = createMockReq({
          ...validProductData,
          sku: '  PIXEL8PRO  '
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });

    describe('Category Validation', () => {
      it('should fail when category is empty', async () => {
        const req = createMockReq({
          ...validProductData,
          category: ''
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Category is required'
            })
          ])
        );
      });

      it('should fail with invalid category ObjectId', async () => {
        const req = createMockReq({
          ...validProductData,
          category: 'invalid-id'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
      });

      it('should pass with valid category ObjectId', async () => {
        const req = createMockReq({
          ...validProductData,
          category: '507f1f77bcf86cd799439011'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });

    describe('Optional Fields Validation', () => {
      it('should pass without specifications', async () => {
        const req = createMockReq(validProductData);
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with valid specifications object', async () => {
        const req = createMockReq({
          ...validProductData,
          specifications: {
            storage: '128GB',
            color: 'Black',
            battery: '5000mAh'
          }
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should fail with non-object specifications', async () => {
        const req = createMockReq({
          ...validProductData,
          specifications: 'not-an-object'
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Specifications must be an object'
            })
          ])
        );
      });

      it('should pass without images', async () => {
        const req = createMockReq(validProductData);
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with valid images array', async () => {
        const req = createMockReq({
          ...validProductData,
          images: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg'
          ]
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should fail with too many images', async () => {
        const req = createMockReq({
          ...validProductData,
          images: Array(11).fill('https://example.com/image.jpg')
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Maximum 10 images allowed'
            })
          ])
        );
      });

      it('should fail with invalid image URLs', async () => {
        const req = createMockReq({
          ...validProductData,
          images: ['not-a-valid-url']
        });
        const result = await runValidation(createProductValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Image must be a valid URL'
            })
          ])
        );
      });
    });
  });

  describe('updateProductValidation', () => {
    it('should pass with valid product update data', async () => {
      const req = createMockReq(
        {
          name: 'Updated Product Name',
          description: 'Updated product description with more details.',
          price: 999.99,
          isActive: true
        },
        { productId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid productId', async () => {
      const req = createMockReq(
        { name: 'Updated Name' },
        { productId: 'invalid-id' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(false);
    });

    it('should pass with partial updates', async () => {
      const req = createMockReq(
        { name: 'Only updating name' },
        { productId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid name length in update', async () => {
      const req = createMockReq(
        { name: 'ab' },
        { productId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Product name must be between 3 and 200 characters'
          })
        ])
      );
    });

    it('should fail with invalid description length in update', async () => {
      const req = createMockReq(
        { description: 'short' },
        { productId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Description must be between 10 and 5000 characters'
          })
        ])
      );
    });

    it('should fail with invalid price in update', async () => {
      const req = createMockReq(
        { price: -10 },
        { productId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Price must be greater than 0'
          })
        ])
      );
    });

    it('should fail with invalid isActive value', async () => {
      const req = createMockReq(
        { isActive: 'not-boolean' },
        { productId: '507f1f77bcf86cd799439011' }
      );
      const result = await runValidation(updateProductValidation, req);
      
      expect(result.isEmpty()).toBe(false);
      expect(result.array()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'isActive must be a boolean value'
          })
        ])
      );
    });

    it('should pass with valid boolean isActive values', async () => {
      const booleanValues = [true, false];
      
      for (const isActive of booleanValues) {
        const req = createMockReq(
          { isActive },
          { productId: '507f1f77bcf86cd799439011' }
        );
        const result = await runValidation(updateProductValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      }
    });
  });

  describe('getProductsValidation', () => {
    it('should pass without any query parameters', async () => {
      const req = createMockReq({}, {}, {});
      const result = await runValidation(getProductsValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    it('should pass with valid query parameters', async () => {
      const req = createMockReq({}, {}, {
        page: '1',
        limit: '20',
        category: '507f1f77bcf86cd799439011',
        minPrice: '100',
        maxPrice: '500',
        search: 'pixel'
      });
      const result = await runValidation(getProductsValidation, req);
      
      expect(result.isEmpty()).toBe(true);
    });

    describe('Page Validation', () => {
      it('should fail with invalid page number', async () => {
        const req = createMockReq({}, {}, { page: '0' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Page must be a positive integer'
            })
          ])
        );
      });

      it('should fail with negative page number', async () => {
        const req = createMockReq({}, {}, { page: '-1' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Page must be a positive integer'
            })
          ])
        );
      });

      it('should fail with non-numeric page', async () => {
        const req = createMockReq({}, {}, { page: 'abc' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
      });
    });

    describe('Limit Validation', () => {
      it('should fail with limit too low', async () => {
        const req = createMockReq({}, {}, { limit: '0' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Limit must be between 1 and 100'
            })
          ])
        );
      });

      it('should fail with limit too high', async () => {
        const req = createMockReq({}, {}, { limit: '101' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Limit must be between 1 and 100'
            })
          ])
        );
      });

      it('should pass with valid limit values', async () => {
        const validLimits = ['1', '50', '100'];
        
        for (const limit of validLimits) {
          const req = createMockReq({}, {}, { limit });
          const result = await runValidation(getProductsValidation, req);
          
          expect(result.isEmpty()).toBe(true);
        }
      });
    });

    describe('Category Validation', () => {
      it('should fail with invalid category ObjectId', async () => {
        const req = createMockReq({}, {}, { category: 'invalid-id' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
      });

      it('should pass with valid category ObjectId', async () => {
        const req = createMockReq({}, {}, { category: '507f1f77bcf86cd799439011' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });

    describe('Price Range Validation', () => {
      it('should fail with negative minimum price', async () => {
        const req = createMockReq({}, {}, { minPrice: '-10' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Minimum price must be positive'
            })
          ])
        );
      });

      it('should fail with negative maximum price', async () => {
        const req = createMockReq({}, {}, { maxPrice: '-5' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Maximum price must be positive'
            })
          ])
        );
      });

      it('should fail when maxPrice is less than minPrice', async () => {
        const req = createMockReq({}, {}, { 
          minPrice: '100',
          maxPrice: '50'
        });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Maximum price must be greater than minimum price'
            })
          ])
        );
      });

      it('should pass with valid price range', async () => {
        const req = createMockReq({}, {}, { 
          minPrice: '100',
          maxPrice: '500'
        });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with equal min and max prices', async () => {
        const req = createMockReq({}, {}, { 
          minPrice: '100',
          maxPrice: '100'
        });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });

    describe('Search Validation', () => {
      it('should fail with search query too long', async () => {
        const req = createMockReq({}, {}, { 
          search: 'a'.repeat(101)
        });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(false);
        expect(result.array()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              msg: 'Search query is too long'
            })
          ])
        );
      });

      it('should pass with maximum length search query', async () => {
        const req = createMockReq({}, {}, { 
          search: 'a'.repeat(100)
        });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should trim whitespace from search query', async () => {
        const req = createMockReq({}, {}, { 
          search: '  pixel phone  '
        });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });

      it('should pass with empty search query', async () => {
        const req = createMockReq({}, {}, { search: '' });
        const result = await runValidation(getProductsValidation, req);
        
        expect(result.isEmpty()).toBe(true);
      });
    });
  });
});