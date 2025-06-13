import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import logger, { logError } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads/products');

const ensureUploadDir = async () => {
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
};

// Initialize upload directory
await ensureUploadDir();

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Middleware for multiple image uploads
export const uploadProductImages = upload.array('images', 10);

// Image processing middleware
export const processProductImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(); // No files to process
    }

    const processedImages = [];

    for (const file of req.files) {
      // Generate unique filename
      const filename = `product-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadsDir, filename);

      try {
        // Process and save image
        await sharp(file.buffer)
          .resize(800, 600, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(filepath);

        // Generate thumbnail
        const thumbnailFilename = `thumb-${filename}`;
        const thumbnailPath = path.join(uploadsDir, thumbnailFilename);

        await sharp(file.buffer)
          .resize(200, 150, {
            fit: 'cover'
          })
          .webp({ quality: 80 })
          .toFile(thumbnailPath);

        processedImages.push({
          original: filename,
          thumbnail: thumbnailFilename,
          url: `/uploads/products/${filename}`,
          thumbnailUrl: `/uploads/products/${thumbnailFilename}`,
          originalName: file.originalname,
          size: file.size,
          mimetype: 'image/webp'
        });

      } catch (imageError) {
        logError(imageError, { context: 'image_processing', filename: file.filename });
        // Continue with other images if one fails
      }
    }

    // Add processed images to request body
    req.body.processedImages = processedImages;
    next();

  } catch (error) {
    logError(error, { context: 'image_processing_middleware' });
    return res.status(400).json({
      success: false,
      error: 'Error processing uploaded images'
    });
  }
};

// Utility function to delete image files
export const deleteProductImages = async (images) => {
  if (!images || images.length === 0) return;

  for (const image of images) {
    try {
      // Delete original image
      if (image.original) {
        const originalPath = path.join(uploadsDir, image.original);
        await fs.unlink(originalPath);
      }

      // Delete thumbnail
      if (image.thumbnail) {
        const thumbnailPath = path.join(uploadsDir, image.thumbnail);
        await fs.unlink(thumbnailPath);
      }
    } catch (error) {
      logError(error, { context: 'image_file_deletion', path: imagePath });
      // Continue with other files
    }
  }
};

// Error handling middleware for multer
export const handleImageUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 5MB per file.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 files allowed.'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    });
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next(error);
};