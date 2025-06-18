import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import multer from 'multer';
import { 
  uploadProductImages, 
  processProductImages, 
  deleteProductImages, 
  handleImageUploadError 
} from '../imageUpload.js';
import { logError } from '../../utils/logger.js';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('sharp');
vi.mock('../../utils/logger.js');

// Mock multer
vi.mock('multer', () => ({
  default: vi.fn(() => ({
    array: vi.fn(() => vi.fn())
  })),
  MulterError: class MulterError extends Error {
    constructor(code, field) {
      super(`MulterError: ${code}`);
      this.code = code;
      this.field = field;
      this.name = 'MulterError';
    }
  },
  memoryStorage: vi.fn()
}));

describe('Image Upload Middleware - Comprehensive Tests', () => {
  let req, res, next;
  let mockSharpInstance;

  beforeEach(() => {
    req = {
      files: [],
      body: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    next = vi.fn();

    // Mock sharp chain
    mockSharpInstance = {
      resize: vi.fn().mockReturnThis(),
      webp: vi.fn().mockReturnThis(),
      toFile: vi.fn().mockResolvedValue({ size: 12345 })
    };

    sharp.mockReturnValue(mockSharpInstance);
    fs.access = vi.fn().mockResolvedValue();
    fs.mkdir = vi.fn().mockResolvedValue();
    fs.unlink = vi.fn().mockResolvedValue();

    vi.clearAllMocks();
  });

  describe('File Filter Function', () => {
    let fileFilter;

    beforeEach(() => {
      // Extract file filter from multer configuration
      const multerCall = multer.mock.calls[0];
      if (multerCall && multerCall[0] && multerCall[0].fileFilter) {
        fileFilter = multerCall[0].fileFilter;
      }
    });

    it('should accept valid image types', () => {
      const cb = vi.fn();
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      validTypes.forEach(mimetype => {
        const file = { mimetype };
        fileFilter(req, file, cb);
        expect(cb).toHaveBeenCalledWith(null, true);
        cb.mockClear();
      });
    });

    it('should reject invalid file types', () => {
      const cb = vi.fn();
      const invalidTypes = ['image/gif', 'text/plain', 'application/pdf', 'video/mp4'];

      invalidTypes.forEach(mimetype => {
        const file = { mimetype };
        fileFilter(req, file, cb);
        expect(cb).toHaveBeenCalledWith(
          expect.any(Error),
          false
        );
        cb.mockClear();
      });
    });
  });

  describe('processProductImages Middleware', () => {
    beforeEach(() => {
      req.files = [
        {
          buffer: Buffer.from('fake-image-data'),
          originalname: 'test-image.jpg',
          size: 12345,
          mimetype: 'image/jpeg'
        },
        {
          buffer: Buffer.from('another-fake-image'),
          originalname: 'test-image-2.png',
          size: 23456,
          mimetype: 'image/png'
        }
      ];
    });

    it('should process multiple images successfully', async () => {
      await processProductImages(req, res, next);

      expect(sharp).toHaveBeenCalledTimes(4); // 2 originals + 2 thumbnails
      expect(mockSharpInstance.resize).toHaveBeenCalledTimes(4);
      expect(mockSharpInstance.webp).toHaveBeenCalledTimes(4);
      expect(mockSharpInstance.toFile).toHaveBeenCalledTimes(4);

      expect(req.body.processedImages).toHaveLength(2);
      expect(req.body.processedImages[0]).toMatchObject({
        original: expect.stringMatching(/^product-\d+-\d+\.webp$/),
        thumbnail: expect.stringMatching(/^thumb-product-\d+-\d+\.webp$/),
        url: expect.stringContaining('/uploads/products/'),
        thumbnailUrl: expect.stringContaining('/uploads/products/'),
        originalName: 'test-image.jpg',
        size: 12345,
        mimetype: 'image/webp'
      });

      expect(next).toHaveBeenCalledWith();
    });

    it('should handle no files gracefully', async () => {
      req.files = [];

      await processProductImages(req, res, next);

      expect(sharp).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle undefined files', async () => {
      req.files = undefined;

      await processProductImages(req, res, next);

      expect(sharp).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should configure image resizing correctly', async () => {
      await processProductImages(req, res, next);

      // Check original image processing
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      });

      // Check thumbnail processing
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(200, 150, {
        fit: 'cover'
      });

      // Check WebP quality settings
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 85 });
      expect(mockSharpInstance.webp).toHaveBeenCalledWith({ quality: 80 });
    });

    it('should continue processing other images if one fails', async () => {
      // Make sharp fail for the first image only
      mockSharpInstance.toFile
        .mockRejectedValueOnce(new Error('Sharp processing failed'))
        .mockResolvedValue({ size: 12345 });

      await processProductImages(req, res, next);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'image_processing' })
      );

      // Should still process the second image
      expect(req.body.processedImages).toHaveLength(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should handle sharp initialization errors', async () => {
      sharp.mockImplementationOnce(() => {
        throw new Error('Sharp initialization failed');
      });

      await processProductImages(req, res, next);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'image_processing_middleware' })
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Error processing uploaded images'
      });
    });

    it('should generate unique filenames', async () => {
      // Mock Date.now and Math.random for consistent testing
      const mockNow = 1609459200000; // 2021-01-01
      const mockRandom = 0.123456789;
      
      vi.spyOn(Date, 'now').mockReturnValue(mockNow);
      vi.spyOn(Math, 'random').mockReturnValue(mockRandom);

      await processProductImages(req, res, next);

      const expectedFilename = `product-${mockNow}-${Math.round(mockRandom * 1E9)}.webp`;
      const expectedThumbnail = `thumb-${expectedFilename}`;

      expect(req.body.processedImages[0].original).toBe(expectedFilename);
      expect(req.body.processedImages[0].thumbnail).toBe(expectedThumbnail);
    });

    it('should handle memory constraints gracefully', async () => {
      // Simulate large file processing
      req.files = [{
        buffer: Buffer.alloc(10 * 1024 * 1024), // 10MB buffer
        originalname: 'large-image.jpg',
        size: 10 * 1024 * 1024,
        mimetype: 'image/jpeg'
      }];

      mockSharpInstance.toFile.mockRejectedValue(new Error('Out of memory'));

      await processProductImages(req, res, next);

      expect(logError).toHaveBeenCalled();
      expect(req.body.processedImages).toHaveLength(0);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('deleteProductImages Function', () => {
    const mockImages = [
      {
        original: 'product-123.webp',
        thumbnail: 'thumb-product-123.webp'
      },
      {
        original: 'product-456.webp',
        thumbnail: 'thumb-product-456.webp'
      }
    ];

    it('should delete all image files successfully', async () => {
      await deleteProductImages(mockImages);

      expect(fs.unlink).toHaveBeenCalledTimes(4); // 2 originals + 2 thumbnails
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('product-123.webp')
      );
      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('thumb-product-123.webp')
      );
    });

    it('should handle empty image array', async () => {
      await deleteProductImages([]);

      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should handle null/undefined images', async () => {
      await deleteProductImages(null);
      await deleteProductImages(undefined);

      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should continue deleting other files if one fails', async () => {
      fs.unlink
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValue();

      await deleteProductImages(mockImages);

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ context: 'image_file_deletion' })
      );

      // Should still attempt to delete other files
      expect(fs.unlink).toHaveBeenCalledTimes(4);
    });

    it('should handle images with missing original or thumbnail', async () => {
      const partialImages = [
        { original: 'product-123.webp' }, // No thumbnail
        { thumbnail: 'thumb-product-456.webp' }, // No original
        {} // No files
      ];

      await deleteProductImages(partialImages);

      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle file system permission errors', async () => {
      fs.unlink.mockRejectedValue(new Error('EACCES: permission denied'));

      await deleteProductImages(mockImages);

      expect(logError).toHaveBeenCalledTimes(4);
      expect(fs.unlink).toHaveBeenCalledTimes(4);
    });
  });

  describe('handleImageUploadError Middleware', () => {
    it('should handle file size limit error', () => {
      const error = new multer.MulterError('LIMIT_FILE_SIZE');

      handleImageUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'File size too large. Maximum size is 5MB per file.'
      });
    });

    it('should handle file count limit error', () => {
      const error = new multer.MulterError('LIMIT_FILE_COUNT');

      handleImageUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many files. Maximum 10 files allowed.'
      });
    });

    it('should handle other multer errors', () => {
      const error = new multer.MulterError('LIMIT_FIELD_VALUE', 'images');

      handleImageUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: `Upload error: ${error.message}`
      });
    });

    it('should handle invalid file type errors', () => {
      const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');

      handleImageUploadError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: error.message
      });
    });

    it('should pass through non-upload errors', () => {
      const error = new Error('Some other error');

      handleImageUploadError(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle errors without message', () => {
      const error = new Error();
      error.message = '';

      handleImageUploadError(error, req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('Multer Configuration', () => {
    it('should configure multer with correct options', () => {
      expect(multer).toHaveBeenCalledWith({
        storage: expect.any(Function),
        fileFilter: expect.any(Function),
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
          files: 10 // Maximum 10 files
        }
      });
    });

    it('should use memory storage', () => {
      expect(multer.memoryStorage).toHaveBeenCalled();
    });
  });

  describe('Directory Creation', () => {
    it('should create uploads directory if it does not exist', async () => {
      fs.access.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

      // Re-import to trigger directory creation
      vi.resetModules();
      await import('../imageUpload.js');

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('uploads/products'),
        { recursive: true }
      );
    });

    it('should not create directory if it already exists', async () => {
      fs.access.mockResolvedValue();

      // Re-import to trigger directory check
      vi.resetModules();
      await import('../imageUpload.js');

      expect(fs.mkdir).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete image upload workflow', async () => {
      req.files = [{
        buffer: Buffer.from('fake-image-data'),
        originalname: 'product-photo.jpg',
        size: 125000,
        mimetype: 'image/jpeg'
      }];

      // Process images
      await processProductImages(req, res, next);

      expect(req.body.processedImages).toHaveLength(1);
      const processedImage = req.body.processedImages[0];

      // Delete images
      await deleteProductImages([processedImage]);

      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent image processing', async () => {
      req.files = Array(5).fill(null).map((_, i) => ({
        buffer: Buffer.from(`fake-image-data-${i}`),
        originalname: `image-${i}.jpg`,
        size: 50000,
        mimetype: 'image/jpeg'
      }));

      await processProductImages(req, res, next);

      expect(req.body.processedImages).toHaveLength(5);
      expect(mockSharpInstance.toFile).toHaveBeenCalledTimes(10); // 5 originals + 5 thumbnails
    });

    it('should handle mixed success/failure scenarios', async () => {
      req.files = [
        {
          buffer: Buffer.from('good-image'),
          originalname: 'good.jpg',
          size: 50000,
          mimetype: 'image/jpeg'
        },
        {
          buffer: Buffer.from('bad-image'),
          originalname: 'bad.jpg',
          size: 50000,
          mimetype: 'image/jpeg'
        }
      ];

      // Make processing fail for the second image
      mockSharpInstance.toFile
        .mockResolvedValueOnce({ size: 12345 }) // Original of first image
        .mockResolvedValueOnce({ size: 12345 }) // Thumbnail of first image
        .mockRejectedValueOnce(new Error('Processing failed')) // Original of second image
        .mockRejectedValueOnce(new Error('Processing failed')); // Thumbnail of second image

      await processProductImages(req, res, next);

      expect(req.body.processedImages).toHaveLength(1);
      expect(logError).toHaveBeenCalledTimes(1);
    });
  });
});