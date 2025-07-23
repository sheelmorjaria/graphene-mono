import mongoose from 'mongoose';

const taxRateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  region: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 2,
    match: [/^[A-Z]{2}$/, 'Country must be a valid ISO 3166-1 alpha-2 code']
  },
  state: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  postalCode: {
    type: String,
    trim: true,
    maxlength: 20,
    default: ''
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100%'],
    get: v => Math.round(v * 10000) / 10000, // 4 decimal places
    set: v => Math.round(v * 10000) / 10000
  },
  type: {
    type: String,
    required: true,
    enum: ['VAT', 'GST', 'sales_tax', 'import_duty', 'other'],
    default: 'VAT'
  },
  calculationMethod: {
    type: String,
    required: true,
    enum: ['inclusive', 'exclusive'],
    default: 'inclusive'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  // For product category-specific rates
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // For specific product types
  applicableProductTypes: {
    type: [String],
    default: []
  },
  // Minimum order value for tax application
  minimumOrderValue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Indexes for efficient querying
taxRateSchema.index({ country: 1, state: 1, isActive: 1 });
taxRateSchema.index({ isActive: 1, priority: -1 });
taxRateSchema.index({ effectiveFrom: 1, effectiveTo: 1 });

// Compound unique index to prevent duplicate rates for same region
taxRateSchema.index(
  { country: 1, state: 1, postalCode: 1, type: 1, effectiveFrom: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      isActive: true,
      effectiveTo: null 
    }
  }
);

// Virtual for formatted rate percentage
taxRateSchema.virtual('formattedRate').get(function() {
  return `${this.rate}%`;
});

// Virtual for effective date range
taxRateSchema.virtual('effectivePeriod').get(function() {
  const from = this.effectiveFrom.toLocaleDateString();
  const to = this.effectiveTo ? this.effectiveTo.toLocaleDateString() : 'Present';
  return `${from} - ${to}`;
});

// Instance method to check if tax rate is currently effective
taxRateSchema.methods.isCurrentlyEffective = function() {
  const now = new Date();
  const effectiveFrom = this.effectiveFrom;
  const effectiveTo = this.effectiveTo;
  
  return this.isActive && 
         effectiveFrom <= now && 
         (!effectiveTo || effectiveTo >= now);
};

// Instance method to calculate tax amount
taxRateSchema.methods.calculateTax = function(amount) {
  if (!this.isCurrentlyEffective()) {
    return 0;
  }
  
  const rate = this.rate / 100;
  
  if (this.calculationMethod === 'inclusive') {
    // Tax already included in amount, extract it
    return amount - (amount / (1 + rate));
  } else {
    // Tax exclusive, add to amount
    return amount * rate;
  }
};

// Instance method to calculate total with tax
taxRateSchema.methods.calculateTotal = function(amount) {
  if (!this.isCurrentlyEffective()) {
    return amount;
  }
  
  const rate = this.rate / 100;
  
  if (this.calculationMethod === 'inclusive') {
    // Tax already included
    return amount;
  } else {
    // Add tax to amount
    return amount * (1 + rate);
  }
};

// Static method to find applicable tax rates for an address
taxRateSchema.statics.findApplicableRates = async function(address, productCategories = [], orderValue = 0) {
  const { country, state = '', postalCode = '' } = address;
  
  const query = {
    country,
    isActive: true,
    effectiveFrom: { $lte: new Date() },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: new Date() } }
    ],
    minimumOrderValue: { $lte: orderValue }
  };
  
  // Add state filter if provided
  if (state) {
    query.$or = [
      { state: '' },
      { state: state }
    ];
  }
  
  const rates = await this.find(query)
    .populate('applicableCategories')
    .sort({ priority: -1, rate: -1 });
  
  // Filter by categories and postal codes
  return rates.filter(rate => {
    // Check postal code match
    if (rate.postalCode && postalCode) {
      const ratePostal = rate.postalCode.replace(/\s/g, '').toUpperCase();
      const addressPostal = postalCode.replace(/\s/g, '').toUpperCase();
      
      // For UK postcodes, match the first part (e.g., SW1A matches SW1A 1AA)
      if (country === 'GB') {
        const ukPostalArea = addressPostal.match(/^([A-Z]{1,2}[0-9][A-Z0-9]?)/);
        if (ukPostalArea && !ratePostal.startsWith(ukPostalArea[1])) {
          return false;
        }
      } else if (ratePostal !== addressPostal) {
        return false;
      }
    }
    
    // Check category applicability
    if (rate.applicableCategories.length > 0) {
      const categoryIds = productCategories.map(cat => cat.toString());
      const applicableIds = rate.applicableCategories.map(cat => cat._id.toString());
      return categoryIds.some(catId => applicableIds.includes(catId));
    }
    
    return true;
  });
};

// Static method to calculate total tax for cart
taxRateSchema.statics.calculateCartTax = async function(cartItems, shippingAddress, shippingCost = 0) {
  if (!shippingAddress || !cartItems.length) {
    return {
      totalTax: 0,
      taxBreakdown: [],
      taxableAmount: 0,
      totalWithTax: 0
    };
  }
  
  // Calculate order value
  const orderValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Get product categories
  const productCategories = [...new Set(
    cartItems.map(item => item.product?.category).filter(Boolean)
  )];
  
  // Find applicable tax rates
  const taxRates = await this.findApplicableRates(shippingAddress, productCategories, orderValue);
  
  if (!taxRates.length) {
    return {
      totalTax: 0,
      taxBreakdown: [],
      taxableAmount: orderValue,
      totalWithTax: orderValue + shippingCost
    };
  }
  
  // Use the highest priority tax rate
  const primaryTaxRate = taxRates[0];
  
  const taxableAmount = orderValue + shippingCost;
  const taxAmount = primaryTaxRate.calculateTax(taxableAmount);
  const totalWithTax = primaryTaxRate.calculateTotal(taxableAmount);
  
  return {
    totalTax: Math.round(taxAmount * 100) / 100,
    taxBreakdown: [{
      name: primaryTaxRate.name,
      rate: primaryTaxRate.rate,
      amount: Math.round(taxAmount * 100) / 100,
      type: primaryTaxRate.type
    }],
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    totalWithTax: Math.round(totalWithTax * 100) / 100
  };
};

// Pre-save validation
taxRateSchema.pre('save', function(next) {
  // Validate effective date range
  if (this.effectiveTo && this.effectiveFrom > this.effectiveTo) {
    return next(new Error('Effective from date cannot be after effective to date'));
  }
  
  // Validate postal code format for known countries
  if (this.postalCode && this.country === 'GB') {
    const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})?$/i;
    if (!ukPostcodeRegex.test(this.postalCode)) {
      return next(new Error('Invalid UK postcode format'));
    }
  }
  
  next();
});

const TaxRate = mongoose.model('TaxRate', taxRateSchema);

export default TaxRate;