import GeneralSettings from '../models/GeneralSettings.js';
import TaxRate from '../models/TaxRate.js';
import PaymentGateway from '../models/PaymentGateway.js';
import ShippingMethod from '../models/ShippingMethod.js';

// General Settings
export const getGeneralSettings = async (req, res) => {
  try {
    const settings = await GeneralSettings.getCurrentSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get general settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch general settings'
    });
  }
};

export const updateGeneralSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate required fields
    const requiredFields = ['storeName', 'storeEmail', 'defaultCurrency', 'defaultLanguage'];
    for (const field of requiredFields) {
      if (!updates[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(updates.storeEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }
    
    // Validate currency code
    if (!/^[A-Z]{3}$/.test(updates.defaultCurrency)) {
      return res.status(400).json({
        success: false,
        error: 'Currency must be a valid 3-letter ISO code'
      });
    }
    
    // Validate language code
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(updates.defaultLanguage)) {
      return res.status(400).json({
        success: false,
        error: 'Language must be a valid language code (e.g., en-gb)'
      });
    }
    
    const settings = await GeneralSettings.updateSettings(updates);
    
    res.json({
      success: true,
      data: settings,
      message: 'General settings updated successfully'
    });
  } catch (error) {
    console.error('Update general settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update general settings'
    });
  }
};

// Shipping Settings
export const getShippingSettings = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [shippingMethods, total] = await Promise.all([
      ShippingMethod.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ShippingMethod.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        shippingMethods,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get shipping settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shipping settings'
    });
  }
};

export const createShippingMethod = async (req, res) => {
  try {
    const shippingMethodData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'code', 'baseCost', 'estimatedDeliveryDays'];
    for (const field of requiredFields) {
      if (shippingMethodData[field] === undefined || shippingMethodData[field] === null) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }
    
    const shippingMethod = new ShippingMethod(shippingMethodData);
    await shippingMethod.save();
    
    res.status(201).json({
      success: true,
      data: shippingMethod,
      message: 'Shipping method created successfully'
    });
  } catch (error) {
    console.error('Create shipping method error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Shipping method code must be unique'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create shipping method'
    });
  }
};

export const updateShippingMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    const updates = req.body;
    
    const shippingMethod = await ShippingMethod.findByIdAndUpdate(
      methodId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!shippingMethod) {
      return res.status(404).json({
        success: false,
        error: 'Shipping method not found'
      });
    }
    
    res.json({
      success: true,
      data: shippingMethod,
      message: 'Shipping method updated successfully'
    });
  } catch (error) {
    console.error('Update shipping method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update shipping method'
    });
  }
};

export const deleteShippingMethod = async (req, res) => {
  try {
    const { methodId } = req.params;
    
    const shippingMethod = await ShippingMethod.findByIdAndUpdate(
      methodId,
      { isActive: false },
      { new: true }
    );
    
    if (!shippingMethod) {
      return res.status(404).json({
        success: false,
        error: 'Shipping method not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Shipping method deactivated successfully'
    });
  } catch (error) {
    console.error('Delete shipping method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete shipping method'
    });
  }
};

// Tax Settings
export const getTaxSettings = async (req, res) => {
  try {
    const { page = 1, limit = 50, country, isActive } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {};
    if (country) query.country = country.toUpperCase();
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    const [taxRates, total] = await Promise.all([
      TaxRate.find(query)
        .populate('applicableCategories', 'name')
        .sort({ country: 1, state: 1, priority: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TaxRate.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        taxRates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tax settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tax settings'
    });
  }
};

export const createTaxRate = async (req, res) => {
  try {
    const taxRateData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'region', 'country', 'rate', 'type', 'calculationMethod'];
    for (const field of requiredFields) {
      if (!taxRateData[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }
    
    // Validate rate range
    if (taxRateData.rate < 0 || taxRateData.rate > 100) {
      return res.status(400).json({
        success: false,
        error: 'Tax rate must be between 0 and 100'
      });
    }
    
    const taxRate = new TaxRate(taxRateData);
    await taxRate.save();
    
    res.status(201).json({
      success: true,
      data: taxRate,
      message: 'Tax rate created successfully'
    });
  } catch (error) {
    console.error('Create tax rate error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'A tax rate for this region and type already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tax rate'
    });
  }
};

export const updateTaxRate = async (req, res) => {
  try {
    const { taxRateId } = req.params;
    const updates = req.body;
    
    // Validate rate if provided
    if (updates.rate !== undefined && (updates.rate < 0 || updates.rate > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Tax rate must be between 0 and 100'
      });
    }
    
    const taxRate = await TaxRate.findByIdAndUpdate(
      taxRateId,
      updates,
      { new: true, runValidators: true }
    ).populate('applicableCategories', 'name');
    
    if (!taxRate) {
      return res.status(404).json({
        success: false,
        error: 'Tax rate not found'
      });
    }
    
    res.json({
      success: true,
      data: taxRate,
      message: 'Tax rate updated successfully'
    });
  } catch (error) {
    console.error('Update tax rate error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tax rate'
    });
  }
};

export const deleteTaxRate = async (req, res) => {
  try {
    const { taxRateId } = req.params;
    
    const taxRate = await TaxRate.findByIdAndUpdate(
      taxRateId,
      { isActive: false },
      { new: true }
    );
    
    if (!taxRate) {
      return res.status(404).json({
        success: false,
        error: 'Tax rate not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Tax rate deactivated successfully'
    });
  } catch (error) {
    console.error('Delete tax rate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete tax rate'
    });
  }
};

// Payment Gateway Settings
export const getPaymentSettings = async (req, res) => {
  try {
    const gateways = await PaymentGateway.getAllWithStatus();
    
    res.json({
      success: true,
      data: { paymentGateways: gateways }
    });
  } catch (error) {
    console.error('Get payment settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment settings'
    });
  }
};

export const updatePaymentGateway = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const updates = req.body;
    
    // Don't allow updating sensitive config fields directly through this endpoint
    if (updates.config) {
      const sensitiveFields = ['stripeSecretKey', 'paypalSecret', 'bitcoinWebhookSecret', 'moneroWebhookSecret'];
      for (const field of sensitiveFields) {
        if (updates.config[field]) {
          delete updates.config[field];
        }
      }
    }
    
    const gateway = await PaymentGateway.findByIdAndUpdate(
      gatewayId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!gateway) {
      return res.status(404).json({
        success: false,
        error: 'Payment gateway not found'
      });
    }
    
    res.json({
      success: true,
      data: gateway,
      message: 'Payment gateway updated successfully'
    });
  } catch (error) {
    console.error('Update payment gateway error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update payment gateway'
    });
  }
};

export const createPaymentGateway = async (req, res) => {
  try {
    const gatewayData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'code', 'type', 'provider'];
    for (const field of requiredFields) {
      if (!gatewayData[field]) {
        return res.status(400).json({
          success: false,
          error: `${field} is required`
        });
      }
    }
    
    const gateway = new PaymentGateway(gatewayData);
    await gateway.save();
    
    res.status(201).json({
      success: true,
      data: gateway,
      message: 'Payment gateway created successfully'
    });
  } catch (error) {
    console.error('Create payment gateway error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Payment gateway code must be unique'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment gateway'
    });
  }
};

export const togglePaymentGateway = async (req, res) => {
  try {
    const { gatewayId } = req.params;
    const { enabled } = req.body;
    
    const gateway = await PaymentGateway.findByIdAndUpdate(
      gatewayId,
      { isEnabled: enabled },
      { new: true, runValidators: true }
    );
    
    if (!gateway) {
      return res.status(404).json({
        success: false,
        error: 'Payment gateway not found'
      });
    }
    
    res.json({
      success: true,
      data: gateway,
      message: `Payment gateway ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle payment gateway error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle payment gateway'
    });
  }
};