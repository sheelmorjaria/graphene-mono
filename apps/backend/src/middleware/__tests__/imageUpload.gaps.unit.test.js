import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs/promises';
import sharp from 'sharp';
import multer from 'multer';
import {
  processProductAndVariationImages,
  processProductImages,
  deleteProductImages,
  handleImageUploadError,
} from '../imageUpload.js';
import { logError } from '../../utils/logger.js';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('sharp');
vi.mock('../../utils/logger.js');

// Mock multer (must match the production import shape)
vi.mock('multer', () => {
  const mockMemoryStorage = vi.fn();
  const mockMulter = vi.fn(() => ({
    array: vi.fn(() => vi.fn()),
    any: vi.fn(() => vi.fn()),
  }));

  const MulterError = class MulterError extends Error {
    constructor(code, field) {
      super(`MulterError: ${code}`);
      this.code = code;
      this.field = field;
      this.name = 'MulterError';
    }
  };

  mockMulter.MulterError = MulterError;

  return {
    default: mockMulter,
    MulterError,
    memoryStorage: mockMemoryStorage,
  };
});

describe('Image Upload Middleware - Coverage Gaps', () => {
  let req, res, next;
  let mockSharpInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      files: [],
      body: {},
      protocol: 'http',
      get: vi.fn((header) => (header === 'host' ? 'localhost:3000' : null)),
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();

    // Mock sharp chain
    mockSharpInstance = {
      resize: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toFile: vi.fn().mockResolvedValue({ size: 12345 }),
    };
    sharp.mockImplementation(() => mockSharpInstance);
    fs.access = vi.fn().mockResolvedValue();
    fs.mkdir = vi.fn().mockResolvedValue();
    fs.unlink = vi.fn().mockResolvedValue();
  });

  describe('processProductAndVariationImages', () => {
    beforeEach(() => {
      req.files = [
        // Main product image
        {
          fieldname: 'images',
          buffer: Buffer.from('main-image'),
          originalname: 'main.jpg',
          size: 10000,
          mimetype: 'image/jpeg',
        },
        // Variation 0 image
        {
          fieldname: 'variation_0_images',
          buffer: Buffer.from('var0-image'),
          originalname: 'var0.jpg',
          size: 5000,
          mimetype: 'image/jpeg',
        },
        // Variation 1 image
        {
          fieldname: 'variation_1_images',
          buffer: Buffer.from('var1-image'),
          originalname: 'var1.png',
          size: 7000,
          mimetype: 'image/png',
        },
      ];
    });

    it('separates and processes main product images and variation images', async () => {
      await processProductAndVariationImages(req, res, next);

      // 3 files x (1 original + 1 thumbnail) = 6 sharp invocations
      expect(sharp).toHaveBeenCalledTimes(6);

      // Main images are full image objects
      expect(req.body.processedImages).toHaveLength(1);
      expect(req.body.processedImages[0]).toMatchObject({
        original: expect.stringMatching(/^product-\d+-\d+\.webp$/),
        thumbnail: expect.stringMatching(/^thumb-product-\d+-\d+\.webp$/),
        url: expect.stringContaining('/uploads/products/'),
        originalName: 'main.jpg',
        mimetype: 'image/webp',
      });

      // Variation images are stored as plain URL strings keyed by index
      expect(req.body.processedVariationImages['0']).toHaveLength(1);
      expect(req.body.processedVariationImages['0'][0]).toEqual(
        expect.stringContaining('/uploads/products/')
      );
      expect(req.body.processedVariationImages['1']).toHaveLength(1);

      expect(next).toHaveBeenCalledWith();
    });

    it('calls next early when no files are present', async () => {
      req.files = [];

      await processProductAndVariationImages(req, res, next);

      expect(sharp).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('calls next early when files is undefined', async () => {
      req.files = undefined;

      await processProductAndVariationImages(req, res, next);

      expect(sharp).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('uses process.env.IMAGE_BASE_URL when set', async () => {
      process.env.IMAGE_BASE_URL = 'https://cdn.example.com';
      req.files = [
        {
          fieldname: 'images',
          buffer: Buffer.from('img'),
          originalname: 'x.jpg',
          size: 100,
          mimetype: 'image/jpeg',
        },
      ];

      await processProductAndVariationImages(req, res, next);

      expect(req.body.processedImages[0].url).toContain(
        'https://cdn.example.com'
      );
      expect(req.get).not.toHaveBeenCalled();

      delete process.env.IMAGE_BASE_URL;
    });

    it('uses the var{index} prefix for variation image filenames', async () => {
      await processProductAndVariationImages(req, res, next);

      // Variation images get processed through processIndividualImage with
      // prefix `var{index}` — verify sharp was invoked for them.
      expect(sharp).toHaveBeenCalledTimes(6);
      expect(req.body.processedVariationImages['0']).toHaveLength(1);
      expect(req.body.processedVariationImages['1']).toHaveLength(1);
    });

    it('continues processing when an individual variation image fails', async () => {
      // First two toFile calls are the original+thumbnail of the main image.
      // Make the variation_0 original (3rd call) fail so processIndividualImage
      // returns null and the variation url is skipped.
      mockSharpInstance.toFile
        .mockResolvedValueOnce({ size: 1 }) // main original
        .mockResolvedValueOnce({ size: 1 }) // main thumb
        .mockRejectedValueOnce(new Error('sharp failed')) // var0 original
        .mockResolvedValue({ size: 1 });

      await processProductAndVariationImages(req, res, next);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'individual_image_processing',
        })
      );
      // var0 produced no url (its only file failed), var1 succeeded
      expect(req.body.processedVariationImages['0']).toEqual([]);
      expect(req.body.processedVariationImages['1']).toHaveLength(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('returns a 400 error when the outer try block throws', async () => {
      // Force the outer try to throw by making req.get throw (used inside getBaseUrl)
      req.get = vi.fn(() => {
        throw new Error('request host unavailable');
      });
      req.files = [
        {
          fieldname: 'images',
          buffer: Buffer.from('img'),
          originalname: 'x.jpg',
          size: 100,
          mimetype: 'image/jpeg',
        },
      ];

      await processProductAndVariationImages(req, res, next);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          context: 'variation_image_processing_middleware',
        })
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error processing uploaded images',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('handles files with unknown fieldnames (neither images nor variation_)', async () => {
      req.files = [
        {
          fieldname: 'something_else',
          buffer: Buffer.from('img'),
          originalname: 'other.jpg',
          size: 100,
          mimetype: 'image/jpeg',
        },
      ];

      await processProductAndVariationImages(req, res, next);

      // Unknown fieldname files are ignored (not processed)
      expect(sharp).not.toHaveBeenCalled();
      expect(req.body.processedImages).toEqual([]);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('processIndividualImage via processProductImages (IMAGE_BASE_URL branch)', () => {
    it('honours IMAGE_BASE_URL in processProductImages as well', async () => {
      process.env.IMAGE_BASE_URL = 'https://images.test';
      req.files = [
        {
          buffer: Buffer.from('img'),
          originalname: 'p.jpg',
          size: 1000,
          mimetype: 'image/jpeg',
        },
      ];

      await processProductImages(req, res, next);

      expect(req.body.processedImages[0].url).toContain('https://images.test');
      delete process.env.IMAGE_BASE_URL;
    });

    it('returns a 400 when the outer try in processProductImages throws', async () => {
      req.get = vi.fn(() => {
        throw new Error('no host');
      });
      req.files = [
        {
          buffer: Buffer.from('img'),
          originalname: 'p.jpg',
          size: 1000,
          mimetype: 'image/jpeg',
        },
      ];

      await processProductImages(req, res, next);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'image_processing_middleware' })
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('handleImageUploadError - additional branches', () => {
    it('handles a generic multer error without a recognised code', () => {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'images');

      handleImageUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: `Upload error: ${error.message}`,
      });
    });

    it('handles an invalid-file-type error with custom text', () => {
      const error = new Error('Invalid file type: rejected');

      handleImageUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid file type: rejected',
      });
    });
  });

  describe('deleteProductImages - edge cases', () => {
    it('deletes only the original when thumbnail is missing', async () => {
      await deleteProductImages([{ original: 'a.webp' }]);

      expect(fs.unlink).toHaveBeenCalledTimes(1);
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('a.webp')
      );
    });

    it('logs an error and continues when deletion fails for one image', async () => {
      fs.unlink
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValue();

      await deleteProductImages([
        { original: 'a.webp', thumbnail: 'thumb-a.webp' },
      ]);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'image_file_deletion' })
      );
    });
  });
});
