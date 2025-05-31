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

    // Return product with all details needed for product details page
    res.json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        longDescription: product.longDescription,
        price: product.price,
        images: product.images,
        category: product.category,
        condition: product.condition,
        stockStatus: product.stockStatus,
        stockQuantity: product.stockQuantity,
        attributes: product.attributes,
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