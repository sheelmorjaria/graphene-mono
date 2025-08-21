import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Create new product with variations
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      shortDescription,
      longDescription,
      baseModel,
      category,
      tags,
      status,
      attributes,
      weight,
      dimensions,
      leadTime,
      images,
      variations
    } = req.body;

    // Validate required fields
    if (!name || !baseModel || !variations || variations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, base model, and at least one variation are required'
      });
    }

    // Validate each variation
    for (const variation of variations) {
      if (!variation.condition || !variation.color || !variation.price || !variation.sku) {
        return res.status(400).json({
          success: false,
          error: 'Each variation must have condition, color, price, and SKU'
        });
      }

      // Check SKU uniqueness across all products
      const existingSku = await Product.findOne({ 'variations.sku': variation.sku });
      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: `SKU ${variation.sku} already exists`
        });
      }
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }
    }

    // Generate slug if not provided
    let productSlug = slug;
    if (!productSlug) {
      productSlug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Ensure slug uniqueness
    let slugCounter = 1;
    let finalSlug = productSlug;
    while (await Product.findOne({ slug: finalSlug })) {
      finalSlug = `${productSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Process tags if provided
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      }
    }

    // Create product data
    const productData = {
      name: name.trim(),
      slug: finalSlug,
      shortDescription: shortDescription?.trim() || '',
      longDescription: longDescription?.trim() || '',
      baseModel: baseModel.trim(),
      status: status || 'draft',
      tags: processedTags,
      images: images || [],
      variations: variations.map(v => ({
        condition: v.condition,
        color: v.color,
        price: parseFloat(v.price),
        salePrice: v.salePrice ? parseFloat(v.salePrice) : undefined,
        stockQuantity: parseInt(v.stockQuantity || 0),
        stockStatus: v.stockStatus || 'in_stock',
        sku: v.sku.trim().toUpperCase(),
        images: v.images || []
      }))
    };

    // Add optional fields
    if (category) productData.category = category;
    if (attributes) productData.attributes = attributes;
    if (weight) productData.weight = parseFloat(weight);
    if (dimensions) productData.dimensions = dimensions;
    if (leadTime) productData.leadTime = leadTime;

    // Process uploaded images if any
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      productData.images = req.uploadedImages;
    }

    // Create product
    const newProduct = new Product(productData);
    await newProduct.save();

    // Populate category for response
    await newProduct.populate('category');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error occurred while creating product'
    });
  }
};

// Update product with variations
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      name,
      slug,
      shortDescription,
      longDescription,
      baseModel,
      category,
      tags,
      status,
      attributes,
      weight,
      dimensions,
      leadTime,
      images,
      variations
    } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    // Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Validate required fields
    if (!name || !baseModel || !variations || variations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, base model, and at least one variation are required'
      });
    }

    // Validate each variation
    for (const variation of variations) {
      // For updates, allow preserving existing values if they exist in the current product
      const existingVariation = existingProduct.variations.find(v => v._id.toString() === variation._id?.toString());
      
      const condition = variation.condition || existingVariation?.condition;
      const color = variation.color || existingVariation?.color;
      const storage = variation.storage || existingVariation?.storage;
      const price = variation.price !== undefined ? variation.price : existingVariation?.price;
      const sku = variation.sku || existingVariation?.sku;
      
      // Debug logging
      console.log('Validating variation:', {
        variation,
        existingVariation: existingVariation ? { _id: existingVariation._id, condition: existingVariation.condition, color: existingVariation.color, storage: existingVariation.storage, price: existingVariation.price, sku: existingVariation.sku } : null,
        resolved: { condition, color, storage, price, sku }
      });
      
      if (!condition || !color || !storage || (price === undefined || price === null) || !sku) {
        console.log('Validation failed for variation:', { condition, color, storage, price, sku });
        return res.status(400).json({
          success: false,
          error: 'Each variation must have condition, color, storage, price, and SKU'
        });
      }

      // Check SKU uniqueness (excluding current product variations)
      const existingSku = await Product.findOne({ 
        'variations.sku': sku,
        _id: { $ne: productId }
      });
      
      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: `SKU ${variation.sku} already exists in another product`
        });
      }
    }

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          error: 'Invalid category ID'
        });
      }
    }

    // Validate slug uniqueness if changed
    if (slug && slug !== existingProduct.slug) {
      const duplicateSlug = await Product.findOne({
        slug: slug,
        _id: { $ne: productId }
      });
      
      if (duplicateSlug) {
        return res.status(400).json({
          success: false,
          error: 'Slug already exists. Please use a unique slug.'
        });
      }
    }

    // Process tags if provided
    let processedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        processedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        processedTags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0);
      }
    }

    // Update product fields
    existingProduct.name = name.trim();
    existingProduct.baseModel = baseModel.trim();
    existingProduct.shortDescription = shortDescription?.trim() || '';
    existingProduct.longDescription = longDescription?.trim() || '';
    existingProduct.status = status || existingProduct.status;
    existingProduct.tags = processedTags;
    
    // Update variations
    existingProduct.variations = variations.map(v => {
      const existingVariation = existingProduct.variations.find(ev => ev._id.toString() === v._id?.toString());
      
      return {
        _id: v._id || existingVariation?._id,
        condition: v.condition || existingVariation?.condition,
        color: v.color || existingVariation?.color,
        storage: v.storage || existingVariation?.storage,
        price: parseFloat(v.price !== undefined ? v.price : existingVariation?.price),
        salePrice: v.salePrice !== undefined ? (v.salePrice ? parseFloat(v.salePrice) : undefined) : existingVariation?.salePrice,
        stockQuantity: parseInt(v.stockQuantity !== undefined ? v.stockQuantity : (existingVariation?.stockQuantity || 0)),
        stockStatus: v.stockStatus || existingVariation?.stockStatus || 'in_stock',
        sku: (v.sku || existingVariation?.sku)?.trim()?.toUpperCase(),
        images: v.images || existingVariation?.images || []
      };
    });

    // Update optional fields
    if (slug) existingProduct.slug = slug;
    if (category !== undefined) existingProduct.category = category || null;
    if (attributes) existingProduct.attributes = attributes;
    if (weight !== undefined) existingProduct.weight = parseFloat(weight);
    if (dimensions) existingProduct.dimensions = dimensions;
    if (leadTime) existingProduct.leadTime = leadTime;
    
    // Update images
    if (req.uploadedImages && req.uploadedImages.length > 0) {
      existingProduct.images = req.uploadedImages;
    } else if (images) {
      existingProduct.images = images;
    }

    // Save updated product
    await existingProduct.save();

    // Populate category for response
    await existingProduct.populate('category');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: existingProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error occurred while updating product'
    });
  }
};

// Get product by ID with variations
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Add computed fields
    const productData = product.toObject();
    productData.priceRange = product.getPriceRange();
    productData.totalStock = product.getTotalStock();
    productData.availableColors = product.getAvailableColors();
    productData.availableConditions = product.getAvailableConditions();

    res.json({
      success: true,
      data: productData
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching product'
    });
  }
};

// Get all products (admin view with variations)
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'variations.sku': { $regex: search, $options: 'i' } },
        { baseModel: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) query.category = category;
    if (status) query.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    // Add computed fields to each product
    const productsWithComputedFields = products.map(product => {
      const productData = product.toObject();
      productData.priceRange = product.getPriceRange();
      productData.totalStock = product.getTotalStock();
      productData.variationCount = product.variations.length;
      return productData;
    });

    res.json({
      success: true,
      data: {
        products: productsWithComputedFields,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching products'
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Soft delete by archiving
    await product.softDelete();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while deleting product'
    });
  }
};

// Bulk update variation stock
export const updateVariationStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { variationId, stockQuantity, stockStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const variation = product.variations.id(variationId);
    
    if (!variation) {
      return res.status(404).json({
        success: false,
        error: 'Variation not found'
      });
    }

    // Update stock
    if (stockQuantity !== undefined) {
      variation.stockQuantity = parseInt(stockQuantity);
    }
    
    if (stockStatus) {
      variation.stockStatus = stockStatus;
    }

    await product.save();

    res.json({
      success: true,
      message: 'Variation stock updated successfully',
      data: variation
    });

  } catch (error) {
    console.error('Update variation stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while updating stock'
    });
  }
};