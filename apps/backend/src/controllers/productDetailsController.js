import Product from '../models/Product.js';

export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // Find active product by slug and populate category
    const product = await Product.findOne({ 
      slug, 
      isActive: true 
    }).populate('category', 'name slug description');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Return product with all details including variations
    const priceRange = product.getPriceRange();
    const availableColors = product.getAvailableColors();
    const availableConditions = product.getAvailableConditions();
    const availableCapacities = product.getAvailableCapacities();
    const availableInterfaces = product.getAvailableInterfaces();
    const isInStock = product.isInStock();
    const totalStock = product.getTotalStock();

    res.json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        baseModel: product.baseModel,
        priceRange,
        images: product.images,
        category: product.category,
        variations: product.variations.map(v => ({
          _id: v._id,
          // Phone variation fields
          condition: v.condition,
          color: v.color,
          storage: v.storage,
          // USB drive variation fields
          capacity: v.capacity,
          interface: v.interface,
          variantName: v.variantName,
          // Common fields
          price: v.price,
          salePrice: v.salePrice,
          stockStatus: v.stockStatus,
          stockQuantity: v.stockQuantity,
          sku: v.sku,
          images: v.images
        })),
        availableColors,
        availableConditions,
        availableCapacities,
        availableInterfaces,
        isInStock,
        totalStock,
        attributes: product.attributes,
        weight: product.weight,
        leadTime: product.leadTime,
        dimensions: product.dimensions,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};