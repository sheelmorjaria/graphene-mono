import express from 'express';
import { getProducts } from '../controllers/productsController.js';
import { getProductBySlug } from '../controllers/productDetailsController.js';
import { searchProducts } from '../controllers/searchController.js';

const router = express.Router();

// GET /api/products/search - Search products by text query
router.get('/search', searchProducts);

// GET /api/products - Get all products with pagination, sorting, and filtering
router.get('/', getProducts);

// GET /api/products/:slug - Get single product by slug
router.get('/:slug', getProductBySlug);

export default router;