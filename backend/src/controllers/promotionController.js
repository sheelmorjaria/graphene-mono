import Promotion from '../models/Promotion.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

// Get all promotions with search, filter, and pagination
export const getAllPromotions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      type = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isDeleted: false };

    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Filter by status
    if (status) {
      if (status === 'expired') {
        query.endDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    const totalPromotions = await Promotion.countDocuments(query);
    const totalPages = Math.ceil(totalPromotions / limit);

    const promotions = await Promotion
      .find(query)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Add computed status for expired promotions
    const promotionsWithStatus = promotions.map(promo => {
      const now = new Date();
      let displayStatus = promo.status;
      
      if (now > promo.endDate) {
        displayStatus = 'expired';
      }
      
      return {
        ...promo,
        displayStatus,
        isExpired: now > promo.endDate,
        isValid: promo.status === 'active' && 
                 now >= promo.startDate && 
                 now <= promo.endDate &&
                 (promo.totalUsageLimit === null || promo.timesUsed < promo.totalUsageLimit)
      };
    });

    res.json({
      promotions: promotionsWithStatus,
      currentPage: page,
      totalPages,
      totalPromotions,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
};

// Create new promotion
export const createPromotion = async (req, res) => {
  try {
    const {
      name,
      code,
      description,
      type,
      value,
      minimumOrderAmount,
      applicableProducts,
      applicableCategories,
      totalUsageLimit,
      perUserUsageLimit,
      startDate,
      endDate,
      status
    } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    // Check if code already exists
    const existingPromotion = await Promotion.findOne({ 
      code: code.toUpperCase(),
      isDeleted: false 
    });
    
    if (existingPromotion) {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }

    // Validate applicable products if provided
    if (applicableProducts && applicableProducts.length > 0) {
      const validProducts = await Product.find({ 
        _id: { $in: applicableProducts },
        isDeleted: false
      });
      
      if (validProducts.length !== applicableProducts.length) {
        return res.status(400).json({ error: 'Invalid product IDs provided' });
      }
    }

    // Validate applicable categories if provided
    if (applicableCategories && applicableCategories.length > 0) {
      const validCategories = await Category.find({ 
        _id: { $in: applicableCategories }
      });
      
      if (validCategories.length !== applicableCategories.length) {
        return res.status(400).json({ error: 'Invalid category IDs provided' });
      }
    }

    const promotion = new Promotion({
      name,
      code: code.toUpperCase(),
      description,
      type,
      value,
      minimumOrderAmount,
      applicableProducts,
      applicableCategories,
      totalUsageLimit,
      perUserUsageLimit,
      startDate: start,
      endDate: end,
      status: status || 'draft',
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await promotion.save();

    const populatedPromotion = await Promotion
      .findById(promotion._id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');

    res.status(201).json({
      message: 'Promotion created successfully',
      promotion: populatedPromotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create promotion' });
  }
};

// Update promotion
export const updatePromotion = async (req, res) => {
  try {
    const { promoId } = req.params;
    const updates = req.body;

    const promotion = await Promotion.findOne({ 
      _id: promoId,
      isDeleted: false 
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Don't allow changing code if promotion has been used
    if (updates.code && promotion.timesUsed > 0 && updates.code !== promotion.code) {
      return res.status(400).json({ 
        error: 'Cannot change code for a promotion that has been used' 
      });
    }

    // Validate dates if provided
    if (updates.startDate || updates.endDate) {
      const start = new Date(updates.startDate || promotion.startDate);
      const end = new Date(updates.endDate || promotion.endDate);
      
      if (end <= start) {
        return res.status(400).json({ error: 'End date must be after start date' });
      }
    }

    // Validate applicable products if provided
    if (updates.applicableProducts && updates.applicableProducts.length > 0) {
      const validProducts = await Product.find({ 
        _id: { $in: updates.applicableProducts },
        isDeleted: false
      });
      
      if (validProducts.length !== updates.applicableProducts.length) {
        return res.status(400).json({ error: 'Invalid product IDs provided' });
      }
    }

    // Validate applicable categories if provided
    if (updates.applicableCategories && updates.applicableCategories.length > 0) {
      const validCategories = await Category.find({ 
        _id: { $in: updates.applicableCategories }
      });
      
      if (validCategories.length !== updates.applicableCategories.length) {
        return res.status(400).json({ error: 'Invalid category IDs provided' });
      }
    }

    // Update allowed fields
    const allowedUpdates = [
      'name', 'description', 'type', 'value', 'minimumOrderAmount',
      'applicableProducts', 'applicableCategories', 'totalUsageLimit',
      'perUserUsageLimit', 'startDate', 'endDate', 'status'
    ];

    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'code' && updates[field]) {
          promotion[field] = updates[field].toUpperCase();
        } else {
          promotion[field] = updates[field];
        }
      }
    });

    promotion.lastModifiedBy = req.user._id;
    await promotion.save();

    const updatedPromotion = await Promotion
      .findById(promotion._id)
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('applicableProducts', 'name')
      .populate('applicableCategories', 'name');

    res.json({
      message: 'Promotion updated successfully',
      promotion: updatedPromotion
    });
  } catch (error) {
    console.error('Error updating promotion:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update promotion' });
  }
};

// Update promotion status
export const updatePromotionStatus = async (req, res) => {
  try {
    const { promoId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'draft'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const promotion = await Promotion.findOne({ 
      _id: promoId,
      isDeleted: false 
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    promotion.status = status;
    promotion.lastModifiedBy = req.user._id;
    await promotion.save();

    res.json({
      message: `Promotion ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'set to draft'} successfully`,
      promotion: {
        _id: promotion._id,
        name: promotion.name,
        code: promotion.code,
        status: promotion.status
      }
    });
  } catch (error) {
    console.error('Error updating promotion status:', error);
    res.status(500).json({ error: 'Failed to update promotion status' });
  }
};

// Soft delete promotion
export const deletePromotion = async (req, res) => {
  try {
    const { promoId } = req.params;

    const promotion = await Promotion.findOne({ 
      _id: promoId,
      isDeleted: false 
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    promotion.isDeleted = true;
    promotion.status = 'inactive';
    promotion.lastModifiedBy = req.user._id;
    await promotion.save();

    res.json({
      message: 'Promotion deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
};

// Check if promotion code is unique
export const checkCodeUniqueness = async (req, res) => {
  try {
    const { code, excludeId } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const query = { 
      code: code.toUpperCase(),
      isDeleted: false 
    };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existingPromotion = await Promotion.findOne(query);

    res.json({
      isUnique: !existingPromotion
    });
  } catch (error) {
    console.error('Error checking code uniqueness:', error);
    res.status(500).json({ error: 'Failed to check code uniqueness' });
  }
};

// Get promotion details for editing
export const getPromotionById = async (req, res) => {
  try {
    const { promoId } = req.params;

    const promotion = await Promotion
      .findOne({ _id: promoId, isDeleted: false })
      .populate('applicableProducts', '_id name')
      .populate('applicableCategories', '_id name')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email');

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json({ promotion });
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ error: 'Failed to fetch promotion' });
  }
};