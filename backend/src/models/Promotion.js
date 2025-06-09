import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed_amount', 'free_shipping']
  },
  value: {
    type: Number,
    required: function() {
      return this.type !== 'free_shipping';
    },
    min: 0,
    validate: {
      validator: function(value) {
        if (this.type === 'percentage') {
          return value > 0 && value <= 100;
        }
        return value > 0;
      },
      message: 'Invalid discount value for type'
    }
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  totalUsageLimit: {
    type: Number,
    default: null,
    min: 1
  },
  perUserUsageLimit: {
    type: Number,
    default: 1,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'draft'],
    default: 'draft'
  },
  timesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  usersUsed: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usageCount: {
      type: Number,
      default: 1
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to determine if promotion is expired
promotionSchema.virtual('isExpired').get(function() {
  return new Date() > this.endDate;
});

// Virtual to determine if promotion is currently valid
promotionSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.startDate && 
         now <= this.endDate &&
         !this.isDeleted &&
         (this.totalUsageLimit === null || this.timesUsed < this.totalUsageLimit);
});

// Indexes for efficient querying
promotionSchema.index({ status: 1, isDeleted: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });
promotionSchema.index({ 'usersUsed.userId': 1 });

// Instance method to check if a user can use this promotion
promotionSchema.methods.canUserUse = function(userId) {
  if (!this.isValid) return false;
  
  const userUsage = this.usersUsed.find(u => u.userId.toString() === userId.toString());
  if (!userUsage) return true;
  
  return userUsage.usageCount < this.perUserUsageLimit;
};

// Instance method to calculate discount amount
promotionSchema.methods.calculateDiscount = function(subtotal, applicableAmount = null) {
  const amount = applicableAmount || subtotal;
  
  switch (this.type) {
    case 'percentage':
      return (amount * this.value) / 100;
    case 'fixed_amount':
      return Math.min(this.value, amount);
    case 'free_shipping':
      return 0; // Handled separately in checkout
    default:
      return 0;
  }
};

// Instance method to record usage
promotionSchema.methods.recordUsage = async function(userId) {
  this.timesUsed += 1;
  
  const existingUser = this.usersUsed.find(u => u.userId.toString() === userId.toString());
  if (existingUser) {
    existingUser.usageCount += 1;
    existingUser.lastUsedAt = new Date();
  } else {
    this.usersUsed.push({
      userId,
      usageCount: 1,
      lastUsedAt: new Date()
    });
  }
  
  return this.save();
};

// Static method to find valid promotion by code
promotionSchema.statics.findValidByCode = async function(code) {
  const promotion = await this.findOne({
    code: code.toUpperCase(),
    isDeleted: false
  });
  
  if (!promotion || !promotion.isValid) {
    return null;
  }
  
  return promotion;
};

const Promotion = mongoose.model('Promotion', promotionSchema);

export default Promotion;