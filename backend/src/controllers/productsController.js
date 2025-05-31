import Product from '../models/Product.js';

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
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

    // Add category filter
    if (category) {
      filter.category = category;
    }

    // Add price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) {
          filter.price.$gte = min;
        }
      }
      if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) {
          filter.price.$lte = max;
        }
      }
    }

    // Add condition filter
    if (condition && ['new', 'excellent', 'good', 'fair'].includes(condition)) {
      filter.condition = condition;
    }

    // Build sort object
    const sortObj = {};
    const validSortFields = ['createdAt', 'price', 'name'];
    if (validSortFields.includes(sortBy)) {
      sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortObj.createdAt = -1; // Default sort
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

    // Format response
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      price: product.price,
      images: product.images,
      condition: product.condition,
      stockStatus: product.stockStatus,
      category: product.category,
      createdAt: product.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};