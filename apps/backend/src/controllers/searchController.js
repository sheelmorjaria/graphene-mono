import Product from '../models/Product.js';

// Helper function to normalize and expand search terms
const normalizeSearchQuery = (query) => {
  const trimmedQuery = query.trim().toLowerCase();
  
  // Handle common variations and synonyms
  const variations = [
    // Pixel model variations
    { pattern: /pixel\s*9\s*pro\s*fold/, replacement: 'pixel 9 pro fold' },
    { pattern: /pixel\s*fold/, replacement: 'pixel fold' },
    { pattern: /fold\s*pixel/, replacement: 'pixel fold' },
    { pattern: /pro\s*fold/, replacement: 'pro fold' },
    
    // General Pixel variations
    { pattern: /pixel\s*(\d+)\s*pro/, replacement: 'pixel $1 pro' },
    { pattern: /pixel\s*(\d+)/, replacement: 'pixel $1' },
    
    // Foldable related terms
    { pattern: /foldable/, replacement: 'fold' },
    { pattern: /folding/, replacement: 'fold' }
  ];
  
  let normalizedQuery = trimmedQuery;
  for (const variation of variations) {
    normalizedQuery = normalizedQuery.replace(variation.pattern, variation.replacement);
  }
  
  return normalizedQuery.trim();
};

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
      // Normalize the query to handle variations
      const normalizedQuery = normalizeSearchQuery(query);
      const words = normalizedQuery.split(/\s+/);
      
      let textSearchQuery;
      if (words.length > 1) {
        // For multi-word queries like "pixel 8", use phrase search
        textSearchQuery = `"${normalizedQuery}"`;
      } else {
        // For single words, use regular text search
        textSearchQuery = normalizedQuery;
      }
      
      searchFilter = {
        $and: [
          { isActive: true },
          { $text: { $search: textSearchQuery } }
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
      // For multi-word queries, prioritize exact matches in the name
      const normalizedQuery = normalizeSearchQuery(query);
      const words = normalizedQuery.split(/\s+/);
      
      // Escape special regex characters
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      if (words.length > 1) {
        // For multi-word queries like "pixel 7" or "pixel 9 pro fold", require all words to be present
        // Also search in shortDescription and longDescription for better matches
        const nameConditions = words.map(word => ({
          $or: [
            { name: { $regex: escapeRegex(word), $options: 'i' } },
            { shortDescription: { $regex: escapeRegex(word), $options: 'i' } },
            { longDescription: { $regex: escapeRegex(word), $options: 'i' } }
          ]
        }));
        
        searchFilter = {
          $and: [
            { isActive: true },
            ...nameConditions
          ]
        };
      } else {
        // For single word queries, search across all fields
        const sanitizedQuery = escapeRegex(normalizedQuery);
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
      }

      // Add additional filters (these work with our new structure)
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