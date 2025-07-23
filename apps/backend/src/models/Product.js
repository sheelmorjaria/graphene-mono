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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0,
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Sale price must be less than regular price'
    }
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
  condition: {
    type: String,
    enum: ['new', 'excellent', 'good', 'fair'],
    required: true,
    default: 'new'
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'low_stock'],
    default: 'in_stock'
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
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

// Instance method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.stockStatus === 'in_stock' || this.stockStatus === 'low_stock';
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
productSchema.index({ condition: 1 });
productSchema.index({ stockStatus: 1 });
productSchema.index({ price: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ createdAt: -1 });

// Indexes for inventory reports
productSchema.index({ stockQuantity: 1, isActive: 1 }); // For stock status queries
productSchema.index({ isActive: 1, stockQuantity: 1 }); // For product counts

export default mongoose.model('Product', productSchema);