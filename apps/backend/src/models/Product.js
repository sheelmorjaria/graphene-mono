import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 200
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 50
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 300
  },
  longDescription: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  baseModel: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  sourceUrl: {
    type: String,
    trim: true,
    maxlength: 500
  },
  lowStockThreshold: {
    type: Number,
    min: 0,
    default: 10
  },
  tags: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  variations: [{
    condition: {
      type: String,
      enum: ['new', 'excellent', 'good', 'fair'],
      required: false
    },
    color: {
      type: String,
      required: false
    },
    storage: {
      type: String,
      required: false,
      trim: true
    },
    // Generic variation fields
    variantName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    salePrice: {
      type: Number,
      min: 0
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    stockStatus: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'low_stock'],
      default: 'in_stock'
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 50
    },
    images: {
      type: [String],
      default: []
    }
  }],
  attributes: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  }],
  // Shipping-related fields
  weight: {
    type: Number,
    min: 0,
    default: 100, // Default weight in grams
    get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
    set: v => Math.round(v * 100) / 100
  },
  leadTime: {
    minDays: {
      type: Number,
      min: 0,
      default: 5 // Default minimum lead time for GrapheneOS phones
    },
    maxDays: {
      type: Number,
      min: 0,
      default: 7 // Default maximum lead time for GrapheneOS phones
    },
    displayText: {
      type: String,
      default: '5-7 working days' // Human-readable lead time
    }
  },
  dimensions: {
    length: {
      type: Number,
      min: 0,
      default: 10 // Default length in cm
    },
    width: {
      type: Number,
      min: 0,
      default: 10 // Default width in cm
    },
    height: {
      type: Number,
      min: 0,
      default: 5 // Default height in cm
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Instance method to generate SEO-friendly URL
productSchema.methods.getUrl = function() {
  return `/products/${this.slug}`;
};

// Instance method to check if product has any variation in stock
productSchema.methods.isInStock = function() {
  if (!this.variations || this.variations.length === 0) {
    return false;
  }
  return this.variations.some(v => v.stockStatus === 'in_stock' || v.stockStatus === 'low_stock');
};

// Instance method to get total stock across all variations
productSchema.methods.getTotalStock = function() {
  if (!this.variations || this.variations.length === 0) {
    return 0;
  }
  return this.variations.reduce((total, variation) => total + variation.stockQuantity, 0);
};

// Instance method to get price range across variations
productSchema.methods.getPriceRange = function() {
  if (!this.variations || this.variations.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const prices = this.variations.map(v => v.salePrice || v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
};

// Instance method to get available colors
productSchema.methods.getAvailableColors = function() {
  if (!this.variations || this.variations.length === 0) {
    return [];
  }
  
  const colors = new Set();
  this.variations
    .filter(v => v.stockStatus !== 'out_of_stock')
    .forEach(v => colors.add(v.color));
  
  return Array.from(colors);
};

// Instance method to get available conditions
productSchema.methods.getAvailableConditions = function() {
  if (!this.variations || this.variations.length === 0) {
    return [];
  }
  
  const conditions = new Set();
  this.variations
    .filter(v => v.stockStatus !== 'out_of_stock')
    .forEach(v => conditions.add(v.condition));
  
  return Array.from(conditions);
};

// Instance method to get available storage options
productSchema.methods.getAvailableStorage = function() {
  if (!this.variations || this.variations.length === 0) {
    return [];
  }
  
  const storageOptions = new Set();
  this.variations
    .filter(v => v.stockStatus !== 'out_of_stock')
    .forEach(v => {
      if (v.storage) storageOptions.add(v.storage);
    });
  
  return Array.from(storageOptions);
};

// Instance method to check if product is archived (soft deleted)
productSchema.methods.isArchived = function() {
  return this.status === 'archived';
};

// Instance method to soft delete (archive) product
productSchema.methods.softDelete = function() {
  this.status = 'archived';
  this.isActive = false;
  return this.save();
};

// Instance method to get formatted lead time
productSchema.methods.getLeadTimeText = function() {
  if (this.leadTime && this.leadTime.displayText) {
    return this.leadTime.displayText;
  }
  
  const minDays = this.leadTime?.minDays || 5;
  const maxDays = this.leadTime?.maxDays || 7;
  
  if (minDays === maxDays) {
    return `${minDays} working days`;
  }
  
  return `${minDays}-${maxDays} working days`;
};

// Create text index for efficient search
productSchema.index({ 
  name: 'text', 
  shortDescription: 'text', 
  longDescription: 'text' 
}, { 
  weights: { 
    name: 10, 
    shortDescription: 5, 
    longDescription: 1 
  },
  name: 'product_text_index'
});

// Create other useful indexes
productSchema.index({ category: 1 });
productSchema.index({ 'variations.condition': 1 });
productSchema.index({ 'variations.color': 1 });
productSchema.index({ 'variations.storage': 1 });
productSchema.index({ 'variations.stockStatus': 1 });
productSchema.index({ 'variations.price': 1 });
productSchema.index({ baseModel: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

// Indexes for inventory reports
productSchema.index({ 'variations.stockQuantity': 1, isActive: 1 }); // For stock status queries
productSchema.index({ isActive: 1, 'variations.stockQuantity': 1 }); // For product counts

export default mongoose.model('Product', productSchema);