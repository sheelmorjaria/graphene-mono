import mongoose from 'mongoose';

const shippingMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    match: /^[A-Z0-9_]+$/
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  estimatedDeliveryDays: {
    min: {
      type: Number,
      required: true,
      min: 1,
      max: 365
    },
    max: {
      type: Number,
      required: true,
      min: 1,
      max: 365
    }
  },
  baseCost: {
    type: Number,
    required: true,
    min: 0,
    get: v => Math.round(v * 100) / 100, // Ensure 2 decimal places
    set: v => Math.round(v * 100) / 100
  },
  criteria: {
    // Weight limits in grams
    minWeight: {
      type: Number,
      default: 0,
      min: 0
    },
    maxWeight: {
      type: Number,
      default: 50000, // 50kg default
      min: 1
    },
    // Order value limits
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    maxOrderValue: {
      type: Number,
      default: 999999.99
    },
    // Supported countries (ISO 3166-1 alpha-2 codes)
    supportedCountries: {
      type: [String],
      default: ['GB', 'IE'], // Default to UK and Ireland
      validate: {
        validator: function(countries) {
          return countries.every(code => /^[A-Z]{2}$/.test(code));
        },
        message: 'All country codes must be valid ISO 3166-1 alpha-2 codes'
      }
    },
    // Free shipping threshold
    freeShippingThreshold: {
      type: Number,
      default: null,
      min: 0
    }
  },
  pricing: {
    // Weight-based pricing per gram above base weight
    weightRate: {
      type: Number,
      default: 0,
      min: 0
    },
    // Base weight included in base cost (in grams)
    baseWeight: {
      type: Number,
      default: 1000, // 1kg
      min: 0
    },
    // Dimensional weight factor (for lightweight but bulky items)
    dimensionalWeightFactor: {
      type: Number,
      default: 5000, // Common DIM factor
      min: 1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes
shippingMethodSchema.index({ isActive: 1, displayOrder: 1 });
shippingMethodSchema.index({ code: 1 }, { unique: true });

// Virtual for formatted delivery time
shippingMethodSchema.virtual('formattedDelivery').get(function() {
  const { min, max } = this.estimatedDeliveryDays;
  if (min === max) {
    return `${min} business day${min === 1 ? '' : 's'}`;
  }
  return `${min}-${max} business days`;
});

// Instance method to calculate shipping cost for given cart and address
shippingMethodSchema.methods.calculateCost = function(cartData, shippingAddress) {
  const { items, totalValue } = cartData;
  const { country } = shippingAddress;
  
  // Check if shipping to supported country
  if (!this.criteria.supportedCountries.includes(country)) {
    return null; // Not eligible
  }
  
  // Check order value limits
  if (totalValue < this.criteria.minOrderValue || totalValue > this.criteria.maxOrderValue) {
    return null; // Not eligible
  }
  
  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => {
    const itemWeight = item.weight || 100; // Default 100g if no weight specified
    return sum + (itemWeight * item.quantity);
  }, 0);
  
  // Check weight limits
  if (totalWeight < this.criteria.minWeight || totalWeight > this.criteria.maxWeight) {
    return null; // Not eligible
  }
  
  // Check for free shipping
  if (this.criteria.freeShippingThreshold && totalValue >= this.criteria.freeShippingThreshold) {
    return {
      cost: 0,
      isFreeShipping: true,
      details: {
        baseCost: 0,
        weightCharge: 0,
        totalWeight,
        qualifiesForFreeShipping: true
      }
    };
  }
  
  // Calculate base cost
  let totalCost = this.baseCost;
  
  // Calculate weight-based charges
  let weightCharge = 0;
  if (totalWeight > this.pricing.baseWeight) {
    const excessWeight = totalWeight - this.pricing.baseWeight;
    weightCharge = excessWeight * this.pricing.weightRate;
  }
  
  totalCost += weightCharge;
  
  // Round to 2 decimal places
  totalCost = Math.round(totalCost * 100) / 100;
  
  return {
    cost: totalCost,
    isFreeShipping: false,
    details: {
      baseCost: this.baseCost,
      weightCharge,
      totalWeight,
      qualifiesForFreeShipping: false
    }
  };
};

// Static method to get all active shipping methods
shippingMethodSchema.statics.getActiveShippingMethods = function() {
  return this.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
};

// Static method to calculate rates for cart and address
shippingMethodSchema.statics.calculateRatesForCart = async function(cartData, shippingAddress) {
  const activeMethods = await this.getActiveShippingMethods();
  const availableRates = [];
  
  for (const method of activeMethods) {
    const calculation = method.calculateCost(cartData, shippingAddress);
    
    if (calculation !== null) {
      availableRates.push({
        id: method._id,
        code: method.code,
        name: method.name,
        description: method.description,
        estimatedDelivery: method.formattedDelivery,
        estimatedDeliveryDays: method.estimatedDeliveryDays,
        cost: calculation.cost,
        isFreeShipping: calculation.isFreeShipping,
        details: calculation.details
      });
    }
  }
  
  return availableRates.sort((a, b) => a.cost - b.cost); // Sort by cost, cheapest first
};

// Pre-save validation
shippingMethodSchema.pre('save', function(next) {
  // Ensure min <= max for delivery days
  if (this.estimatedDeliveryDays.min > this.estimatedDeliveryDays.max) {
    const error = new Error('Minimum delivery days cannot be greater than maximum delivery days');
    return next(error);
  }
  
  // Ensure weight limits make sense
  if (this.criteria.minWeight >= this.criteria.maxWeight) {
    const error = new Error('Minimum weight must be less than maximum weight');
    return next(error);
  }
  
  // Ensure order value limits make sense
  if (this.criteria.minOrderValue >= this.criteria.maxOrderValue) {
    const error = new Error('Minimum order value must be less than maximum order value');
    return next(error);
  }
  
  next();
});

const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);

export default ShippingMethod;