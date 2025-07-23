import Product from '../models/Product.js';

export const searchProducts = async (req, res) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      minPrice,
      maxPrice,
      condition
    } = req.query;

    // Validate search query
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    let searchFilter;
    const sortObj = {};

    try {
      // Try MongoDB text search first
      searchFilter = {
        $and: [
          { isActive: true },
          { $text: { $search: query.trim() } }
        ]
      };

      // Add additional filters
      if (category) {
        searchFilter.$and.push({ category });
      }

      if (condition && ['new', 'excellent', 'good', 'fair'].includes(condition)) {
        searchFilter.$and.push({ condition });
      }

      // Add price range filter
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
        if (Object.keys(priceFilter).length > 0) {
          searchFilter.$and.push({ price: priceFilter });
        }
      }

      // Build sort object
      const validSortFields = ['createdAt', 'price', 'name'];
      if (validSortFields.includes(sortBy)) {
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
      } else {
        // Default sort by text score (relevance) when doing text search
        sortObj.score = { $meta: 'textScore' };
      }

      // Test if text search is available by doing a quick query
      await Product.findOne(searchFilter);

    } catch (error) {
      // Fall back to regex search if text search fails
      
      // Sanitize and escape special regex characters
      const sanitizedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      searchFilter = {
        $and: [
          { isActive: true },
          {
            $or: [
              { name: { $regex: sanitizedQuery, $options: 'i' } },
              { shortDescription: { $regex: sanitizedQuery, $options: 'i' } },
              { longDescription: { $regex: sanitizedQuery, $options: 'i' } }
            ]
          }
        ]
      };

      // Add additional filters
      if (category) {
        searchFilter.$and.push({ category });
      }

      if (condition && ['new', 'excellent', 'good', 'fair'].includes(condition)) {
        searchFilter.$and.push({ condition });
      }

      // Add price range filter
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
        if (Object.keys(priceFilter).length > 0) {
          searchFilter.$and.push({ price: priceFilter });
        }
      }

      // Build sort object for regex search
      const validSortFields = ['createdAt', 'price', 'name'];
      if (validSortFields.includes(sortBy)) {
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
      } else {
        sortObj.createdAt = -1; // Default sort
      }
    }

    // Execute search query
    const products = await Product
      .find(searchFilter)
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .exec();

    // Get total count for pagination
    const total = await Product.countDocuments(searchFilter);
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
      data: {
        products: formattedProducts,
        totalPages: pages,
        currentPage: pageNum,
        totalProducts: total
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};