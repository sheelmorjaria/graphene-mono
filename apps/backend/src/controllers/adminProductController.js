import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { createObjectCsvStringifier } from 'csv-writer';

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
      images
    } = req.body;

    let { variations } = req.body;

    // Parse variations if it's a string (from FormData)
    if (typeof variations === 'string') {
      try {
        variations = JSON.parse(variations);
      } catch (_error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid variations JSON format'
        });
      }
    }

    // Validate required fields
    if (!name || !baseModel || !variations || variations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Name, base model, and at least one variation are required'
      });
    }

    // Validate each variation (flexible validation for different product types)
    for (const variation of variations) {
      // Check for required price and SKU
      if (!variation.price || !variation.sku) {
        return res.status(400).json({
          success: false,
          error: 'Each variation must have price and SKU'
        });
      }

      // Check for required phone fields
      const hasPhoneFields = variation.condition && variation.color;

      if (!hasPhoneFields) {
        return res.status(400).json({
          success: false,
          error: 'Each variation must have condition and color'
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

    // Process variation images from processed variation images
    const processedVariationImages = req.body.processedVariationImages || {};

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
      variations: variations.map((v, index) => ({
        // Phone fields
        condition: v.condition,
        color: v.color,
        storage: v.storage,

        // Common fields
        price: parseFloat(v.price),
        salePrice: v.salePrice ? parseFloat(v.salePrice) : undefined,
        stockQuantity: parseInt(v.stockQuantity || 0),
        stockStatus: v.stockStatus || 'in_stock',
        sku: v.sku.trim().toUpperCase(),
        images: processedVariationImages[index] || v.images || []
      }))
    };

    // Add optional fields
    if (category) productData.category = category;
    if (attributes) productData.attributes = attributes;
    if (weight) productData.weight = parseFloat(weight);
    if (dimensions) productData.dimensions = dimensions;
    if (leadTime) productData.leadTime = leadTime;

    // Process uploaded main product images
    if (req.body.processedImages && req.body.processedImages.length > 0) {
      productData.images = req.body.processedImages.map(img => img.url);
    } else if (images) {
      // Handle images passed as JSON string or array
      if (typeof images === 'string') {
        try {
          const parsedImages = JSON.parse(images);
          productData.images = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
        } catch (_e) {
          // If not valid JSON, treat as single URL
          productData.images = [images];
        }
      } else if (Array.isArray(images)) {
        productData.images = images;
      } else {
        productData.images = [images];
      }
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
      images
    } = req.body;

    let { variations } = req.body;

    // Parse variations if it's a string (from FormData)
    if (typeof variations === 'string') {
      console.log('Parsing variations string:', variations.substring(0, 200) + (variations.length > 200 ? '...' : ''));
      try {
        variations = JSON.parse(variations);
        console.log('Successfully parsed variations:', variations.length, 'items');
      } catch (error) {
        console.log('Failed to parse variations JSON:', error.message);
        return res.status(400).json({
          success: false,
          error: 'Invalid variations JSON format'
        });
      }
    }

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

    // Validate each variation (flexible validation for updates)
    for (const variation of variations) {
      // For updates, allow preserving existing values if they exist in the current product
      const existingVariation = existingProduct.variations.find(v => v._id.toString() === variation._id?.toString());
      
      const price = variation.price !== undefined ? variation.price : existingVariation?.price;
      const sku = variation.sku || existingVariation?.sku;
      
      // Check required fields
      if ((price === undefined || price === null) || !sku) {
        return res.status(400).json({
          success: false,
          error: 'Each variation must have price and SKU'
        });
      }

      // Check for required phone fields
      const condition = variation.condition || existingVariation?.condition;
      const color = variation.color || existingVariation?.color;

      const hasPhoneFields = condition && color;

      if (!hasPhoneFields) {
        return res.status(400).json({
          success: false,
          error: 'Each variation must have condition and color'
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
          error: `SKU ${sku} already exists in another product`
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
    
    // Process variation images from processed variation images
    const processedVariationImages = req.body.processedVariationImages || {};

    // Update variations
    existingProduct.variations = variations.map((v, index) => {
      const existingVariation = existingProduct.variations.find(ev => ev._id.toString() === v._id?.toString());
      
      return {
        _id: v._id || existingVariation?._id,

        // Phone fields
        condition: v.condition || existingVariation?.condition,
        color: v.color || existingVariation?.color,
        storage: v.storage || existingVariation?.storage,

        // Common fields
        price: parseFloat(v.price !== undefined ? v.price : existingVariation?.price),
        salePrice: v.salePrice !== undefined ? (v.salePrice ? parseFloat(v.salePrice) : undefined) : existingVariation?.salePrice,
        stockQuantity: parseInt(v.stockQuantity !== undefined ? v.stockQuantity : (existingVariation?.stockQuantity || 0)),
        stockStatus: v.stockStatus || existingVariation?.stockStatus || 'in_stock',
        sku: (v.sku || existingVariation?.sku)?.trim()?.toUpperCase(),
        images: processedVariationImages[index] || v.images || existingVariation?.images || []
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
    if (req.body.processedImages && req.body.processedImages.length > 0) {
      // New images were uploaded and processed
      existingProduct.images = req.body.processedImages.map(img => img.url);
    } else if (images) {
      // Images passed as parameter (could be JSON string or array)
      if (typeof images === 'string') {
        try {
          const parsedImages = JSON.parse(images);
          existingProduct.images = Array.isArray(parsedImages) ? parsedImages : [parsedImages];
        } catch (_e) {
          // If not valid JSON, treat as single URL
          existingProduct.images = [images];
        }
      } else if (Array.isArray(images)) {
        existingProduct.images = images;
      } else {
        existingProduct.images = [images];
      }
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

// Export all products to CSV
export const exportProductsToCSV = async (req, res) => {
  try {
    // Fetch all products with their variations
    const products = await Product.find({})
      .populate('category')
      .sort({ createdAt: -1 });

    // Prepare CSV data - flatten variations for each product
    const csvData = [];
    
    products.forEach(product => {
      if (product.variations && product.variations.length > 0) {
        product.variations.forEach((variation, index) => {
          csvData.push({
            // Product base information
            productId: product._id.toString(),
            productName: product.name,
            productSlug: product.slug,
            productSKU: product.sku,
            shortDescription: product.shortDescription || '',
            longDescription: product.longDescription || '',
            baseModel: product.baseModel,
            category: product.category ? product.category.name : '',
            categoryId: product.category ? product.category._id.toString() : '',
            tags: product.tags ? product.tags.join(';') : '',
            productImages: product.images ? product.images.join(';') : '',
            status: product.status,
            isActive: product.isActive,
            
            // Variation information
            variationIndex: index,
            condition: variation.condition || '',
            color: variation.color || '',
            storage: variation.storage || '',
            variantName: variation.variantName || '',
            price: variation.price,
            salePrice: variation.salePrice || '',
            stockQuantity: variation.stockQuantity,
            stockStatus: variation.stockStatus,
            variationSKU: variation.sku,
            variationImages: variation.images ? variation.images.join(';') : '',
            
            // Shipping information
            weight: product.weight || 100,
            leadTimeMin: product.leadTime?.minDays || 5,
            leadTimeMax: product.leadTime?.maxDays || 7,
            leadTimeText: product.leadTime?.displayText || '5-7 working days',
            dimensionLength: product.dimensions?.length || 10,
            dimensionWidth: product.dimensions?.width || 10,
            dimensionHeight: product.dimensions?.height || 5,
            
            // Attributes (if any)
            attributes: product.attributes ? 
              product.attributes.map(attr => `${attr.name}:${attr.value}`).join(';') : '',
            
            // Timestamps
            createdAt: product.createdAt ? product.createdAt.toISOString() : '',
            updatedAt: product.updatedAt ? product.updatedAt.toISOString() : ''
          });
        });
      } else {
        // Product without variations - still export base information
        csvData.push({
          productId: product._id.toString(),
          productName: product.name,
          productSlug: product.slug,
          productSKU: product.sku,
          shortDescription: product.shortDescription || '',
          longDescription: product.longDescription || '',
          baseModel: product.baseModel,
          category: product.category ? product.category.name : '',
          categoryId: product.category ? product.category._id.toString() : '',
          tags: product.tags ? product.tags.join(';') : '',
          productImages: product.images ? product.images.join(';') : '',
          status: product.status,
          isActive: product.isActive,
          variationIndex: 0,
          condition: '',
          color: '',
          storage: '',
          variantName: '',
          price: 0,
          salePrice: '',
          stockQuantity: 0,
          stockStatus: 'out_of_stock',
          variationSKU: '',
          variationImages: '',
          weight: product.weight || 100,
          leadTimeMin: product.leadTime?.minDays || 5,
          leadTimeMax: product.leadTime?.maxDays || 7,
          leadTimeText: product.leadTime?.displayText || '5-7 working days',
          dimensionLength: product.dimensions?.length || 10,
          dimensionWidth: product.dimensions?.width || 10,
          dimensionHeight: product.dimensions?.height || 5,
          attributes: product.attributes ? 
            product.attributes.map(attr => `${attr.name}:${attr.value}`).join(';') : '',
          createdAt: product.createdAt ? product.createdAt.toISOString() : '',
          updatedAt: product.updatedAt ? product.updatedAt.toISOString() : ''
        });
      }
    });

    // Create CSV string
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'productId', title: 'Product ID' },
        { id: 'productName', title: 'Product Name' },
        { id: 'productSlug', title: 'Product Slug' },
        { id: 'productSKU', title: 'Product SKU' },
        { id: 'shortDescription', title: 'Short Description' },
        { id: 'longDescription', title: 'Long Description' },
        { id: 'baseModel', title: 'Base Model' },
        { id: 'category', title: 'Category' },
        { id: 'categoryId', title: 'Category ID' },
        { id: 'tags', title: 'Tags (;-separated)' },
        { id: 'productImages', title: 'Product Images (;-separated)' },
        { id: 'status', title: 'Status' },
        { id: 'isActive', title: 'Is Active' },
        { id: 'variationIndex', title: 'Variation Index' },
        { id: 'condition', title: 'Condition' },
        { id: 'color', title: 'Color' },
        { id: 'storage', title: 'Storage' },
        { id: 'variantName', title: 'Variant Name' },
        { id: 'price', title: 'Price (GBP)' },
        { id: 'salePrice', title: 'Sale Price (GBP)' },
        { id: 'stockQuantity', title: 'Stock Quantity' },
        { id: 'stockStatus', title: 'Stock Status' },
        { id: 'variationSKU', title: 'Variation SKU' },
        { id: 'variationImages', title: 'Variation Images (;-separated)' },
        { id: 'weight', title: 'Weight (g)' },
        { id: 'leadTimeMin', title: 'Lead Time Min (days)' },
        { id: 'leadTimeMax', title: 'Lead Time Max (days)' },
        { id: 'leadTimeText', title: 'Lead Time Display' },
        { id: 'dimensionLength', title: 'Length (cm)' },
        { id: 'dimensionWidth', title: 'Width (cm)' },
        { id: 'dimensionHeight', title: 'Height (cm)' },
        { id: 'attributes', title: 'Attributes (;-separated)' },
        { id: 'createdAt', title: 'Created At' },
        { id: 'updatedAt', title: 'Updated At' }
      ]
    });

    const csvHeader = csvStringifier.getHeaderString();
    const csvBody = csvStringifier.stringifyRecords(csvData);
    const csvContent = csvHeader + csvBody;

    // Set response headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-${timestamp}.csv"`);
    
    // Send CSV content
    res.send(csvContent);

  } catch (error) {
    console.error('Export products to CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while exporting products'
    });
  }
};