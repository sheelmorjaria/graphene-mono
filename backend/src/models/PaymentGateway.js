import mongoose from 'mongoose';

const paymentGatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20,
    match: [/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores']
  },
  type: {
    type: String,
    required: true,
    enum: ['credit_card', 'digital_wallet', 'bank_transfer', 'cryptocurrency', 'buy_now_pay_later'],
    default: 'credit_card'
  },
  provider: {
    type: String,
    required: true,
    enum: ['stripe', 'paypal', 'square', 'adyen', 'bitcoin', 'monero', 'other'],
    default: 'other'
  },
  isEnabled: {
    type: Boolean,
    default: false
  },
  isTestMode: {
    type: Boolean,
    default: true
  },
  supportedCurrencies: {
    type: [String],
    required: true,
    validate: {
      validator: function(currencies) {
        return currencies.every(code => /^[A-Z]{3}$/.test(code));
      },
      message: 'All currency codes must be valid ISO 4217 currency codes'
    },
    default: ['GBP', 'USD', 'EUR']
  },
  supportedCountries: {
    type: [String],
    required: true,
    validate: {
      validator: function(countries) {
        return countries.every(code => /^[A-Z]{2}$/.test(code));
      },
      message: 'All country codes must be valid ISO 3166-1 alpha-2 codes'
    },
    default: ['GB', 'US', 'IE']
  },
  displayOrder: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  customerMessage: {
    type: String,
    trim: true,
    maxlength: 200,
    default: ''
  },
  // Configuration specific to each gateway
  config: {
    // For Stripe
    stripePublishableKey: {
      type: String,
      trim: true,
      default: ''
    },
    stripeWebhookSecret: {
      type: String,
      trim: true,
      default: ''
    },
    // For PayPal
    paypalClientId: {
      type: String,
      trim: true,
      default: ''
    },
    paypalWebhookId: {
      type: String,
      trim: true,
      default: ''
    },
    // For Bitcoin
    bitcoinApiKey: {
      type: String,
      trim: true,
      default: ''
    },
    bitcoinWebhookSecret: {
      type: String,
      trim: true,
      default: ''
    },
    // For Monero
    moneroApiKey: {
      type: String,
      trim: true,
      default: ''
    },
    moneroWebhookSecret: {
      type: String,
      trim: true,
      default: ''
    },
    // Generic API settings
    apiUrl: {
      type: String,
      trim: true,
      default: ''
    },
    apiVersion: {
      type: String,
      trim: true,
      default: ''
    }
  },
  fees: {
    // Fixed fee per transaction
    fixedFee: {
      type: Number,
      default: 0,
      min: 0,
      get: v => v ? Math.round(v * 10000) / 10000 : 0,
      set: v => v
    },
    // Percentage fee (e.g., 2.9 for 2.9%)
    percentageFee: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
      get: v => Math.round(v * 100) / 100,
      set: v => Math.round(v * 100) / 100
    },
    // Currency for fixed fee
    feeCurrency: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 3,
      match: [/^[A-Z]{3}$/, 'Fee currency must be a valid ISO 4217 currency code'],
      default: 'GBP'
    }
  },
  limits: {
    // Minimum transaction amount
    minAmount: {
      type: Number,
      default: 0.01,
      min: 0
    },
    // Maximum transaction amount
    maxAmount: {
      type: Number,
      default: 10000,
      min: 0
    },
    // Maximum daily transaction amount
    dailyLimit: {
      type: Number,
      default: null,
      min: 0
    }
  },
  features: {
    supportsRefunds: {
      type: Boolean,
      default: false
    },
    supportsPartialRefunds: {
      type: Boolean,
      default: false
    },
    supportsRecurring: {
      type: Boolean,
      default: false
    },
    supportsPreauth: {
      type: Boolean,
      default: false
    },
    requiresRedirect: {
      type: Boolean,
      default: false
    },
    supportsWebhooks: {
      type: Boolean,
      default: false
    }
  },
  // Security settings
  security: {
    requiresSSL: {
      type: Boolean,
      default: true
    },
    pciCompliant: {
      type: Boolean,
      default: false
    },
    requires3DS: {
      type: Boolean,
      default: false
    }
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      // Remove sensitive config data from JSON output
      if (ret.config) {
        Object.keys(ret.config).forEach(key => {
          if (key.includes('Secret') || key.includes('Key')) {
            ret.config[key] = ret.config[key] ? '[CONFIGURED]' : '[NOT CONFIGURED]';
          }
        });
      }
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Indexes
paymentGatewaySchema.index({ code: 1 }, { unique: true });
paymentGatewaySchema.index({ isEnabled: 1, displayOrder: 1 });
paymentGatewaySchema.index({ provider: 1, isEnabled: 1 });

// Virtual for formatted fee display
paymentGatewaySchema.virtual('formattedFee').get(function() {
  const parts = [];
  
  if (this.fees.fixedFee > 0) {
    parts.push(`${this.fees.feeCurrency} ${this.fees.fixedFee.toFixed(2)}`);
  }
  
  if (this.fees.percentageFee > 0) {
    parts.push(`${this.fees.percentageFee}%`);
  }
  
  return parts.length > 0 ? parts.join(' + ') : 'No fees';
});

// Virtual for configuration status
paymentGatewaySchema.virtual('configurationStatus').get(function() {
  const requiredFields = this.getRequiredConfigFields();
  const configuredFields = requiredFields.filter(field => this.config[field]);
  
  return {
    isComplete: configuredFields.length === requiredFields.length,
    configured: configuredFields.length,
    required: requiredFields.length
  };
});

// Instance method to get required configuration fields
paymentGatewaySchema.methods.getRequiredConfigFields = function() {
  switch (this.provider) {
  case 'stripe':
    return ['stripePublishableKey'];
  case 'paypal':
    return ['paypalClientId'];
  case 'bitcoin':
    return ['bitcoinApiKey'];
  case 'monero':
    return ['moneroApiKey'];
  default:
    return [];
  }
};

// Instance method to check if gateway is properly configured
paymentGatewaySchema.methods.isProperlyConfigured = function() {
  const requiredFields = this.getRequiredConfigFields();
  return requiredFields.every(field => this.config[field]);
};

// Instance method to check if gateway supports currency
paymentGatewaySchema.methods.supportsCurrency = function(currency) {
  return this.supportedCurrencies.includes(currency.toUpperCase());
};

// Instance method to check if gateway supports country
paymentGatewaySchema.methods.supportsCountry = function(country) {
  return this.supportedCountries.includes(country.toUpperCase());
};

// Instance method to check if gateway is available
paymentGatewaySchema.methods.isAvailable = function() {
  return this.isEnabled && this.isProperlyConfigured();
};

// Instance method to validate configuration
paymentGatewaySchema.methods.validateConfig = function() {
  return this.isProperlyConfigured();
};

// Instance method to get secure config without sensitive data
paymentGatewaySchema.methods.getSecureConfig = function() {
  const secureConfig = {};
  Object.keys(this.config.toObject()).forEach(key => {
    if (!key.includes('Secret') && !key.includes('Key') && !key.includes('ClientId')) {
      secureConfig[key] = this.config[key];
    }
  });
  return secureConfig;
};

// Instance method to calculate transaction fee
paymentGatewaySchema.methods.calculateFee = function(amount, currency = 'GBP') {
  let fee = this.fees.fixedFee || 0;
  
  // Convert fixed fee to transaction currency if different
  if (this.fees.feeCurrency !== currency.toUpperCase()) {
    // In a real application, you'd use an exchange rate service
    // For now, we'll assume 1:1 conversion or implement basic rates
    fee = this.fees.fixedFee || 0; // Simplified
  }
  
  // Add percentage fee
  if (this.fees.percentageFee > 0) {
    fee += amount * (this.fees.percentageFee / 100);
  }
  
  return Math.round(fee * 10000) / 10000;
};

// Instance method to check transaction limits
paymentGatewaySchema.methods.isAmountWithinLimits = function(amount) {
  return amount >= this.limits.minAmount && amount <= this.limits.maxAmount;
};

// Static method to find enabled gateways
paymentGatewaySchema.statics.findEnabled = async function() {
  return this.find({ isEnabled: true });
};

// Static method to find gateways by type
paymentGatewaySchema.statics.findByType = async function(type) {
  return this.find({ type });
};

// Static method to find gateways supporting currency
paymentGatewaySchema.statics.findSupportingCurrency = async function(currency) {
  return this.find({ supportedCurrencies: currency.toUpperCase() });
};

// Static method to get enabled gateways for country and currency
paymentGatewaySchema.statics.getAvailableGateways = async function(country, currency) {
  const gateways = await this.find({
    isEnabled: true,
    supportedCountries: country.toUpperCase(),
    supportedCurrencies: currency.toUpperCase()
  }).sort({ displayOrder: 1, name: 1 });
  
  return gateways.filter(gateway => gateway.isProperlyConfigured());
};

// Static method to get enabled gateways with their configuration status
paymentGatewaySchema.statics.getAllWithStatus = async function() {
  const gateways = await this.find().sort({ displayOrder: 1, name: 1 });
  
  return gateways.map(gateway => ({
    ...gateway.toJSON(),
    configurationStatus: gateway.configurationStatus,
    isProperlyConfigured: gateway.isProperlyConfigured()
  }));
};

// Pre-save validation
paymentGatewaySchema.pre('save', function(next) {
  // Validate amount limits
  if (this.limits.minAmount >= this.limits.maxAmount) {
    return next(new Error('Minimum amount must be less than maximum amount'));
  }
  
  // Validate fee percentage
  if (this.fees.percentageFee > 50) {
    return next(new Error('Percentage fee cannot exceed 50%'));
  }
  
  next();
});

// Instance method for soft delete
paymentGatewaySchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Instance method to restore soft deleted gateway
paymentGatewaySchema.methods.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

// Pre-find hook to exclude soft deleted items
paymentGatewaySchema.pre(/^find/, function() {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const PaymentGateway = mongoose.model('PaymentGateway', paymentGatewaySchema);

export default PaymentGateway;