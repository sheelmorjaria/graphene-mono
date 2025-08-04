import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { logError } from '../utils/logger.js';

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = 'price',
      sortOrder = 'asc',
      category,
      minPrice,
      maxPrice,
      condition
    } = req.query;


    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    const filter = { isActive: true };

    // Add category filter - look up category by slug
    if (category) {
      const categoryDoc = await Category.findOne({ slug: category });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      } else {
        // If category slug not found, return empty results
        filter.category = null;
      }
    }

    // Add price range filter for variations
    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) {
          priceFilter.$gte = min;
        }
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) {
          priceFilter.$lte = max;
        }
      }
      // Filter by variation prices
      if (Object.keys(priceFilter).length > 0) {
        filter['variations.price'] = priceFilter;
      }
    }

    // Add condition filter for variations
    if (condition && ['new', 'excellent', 'good', 'fair'].includes(condition)) {
      filter['variations.condition'] = condition;
    }

    // Build sort object
    const sortObj = {};
    const validSortFields = ['createdAt', 'price', 'name'];
    if (validSortFields.includes(sortBy)) {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.price = 1; // Default sort by price ascending
    }

    // Execute query
    const products = await Product
      .find(filter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    const pages = Math.ceil(total / limitNum);

    // Format response with variation data
    const formattedProducts = products.map(product => {
      const priceRange = product.getPriceRange();
      const availableColors = product.getAvailableColors();
      const availableConditions = product.getAvailableConditions();
      const isInStock = product.isInStock();
      
      return {
        id: product._id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        baseModel: product.baseModel,
        priceRange,
        images: product.images.length > 0 ? product.images : (product.variations[0]?.images || []),
        variations: product.variations.map(v => ({
          condition: v.condition,
          color: v.color,
          price: v.price,
          salePrice: v.salePrice,
          stockStatus: v.stockStatus,
          sku: v.sku
        })),
        availableColors,
        availableConditions,
        isInStock,
        category: product.category,
        createdAt: product.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
        hasNext: pageNum < pages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    logError('Error fetching products', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};