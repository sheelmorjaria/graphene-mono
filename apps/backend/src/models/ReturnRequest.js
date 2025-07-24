import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200
  },
  productSlug: {
    type: String,
    required: [true, 'Product slug is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [99, 'Quantity cannot exceed 99']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalRefundAmount: {
    type: Number,
    required: [true, 'Total refund amount is required'],
    min: [0, 'Total refund amount cannot be negative']
  },
  reason: {
    type: String,
    required: [true, 'Return reason is required'],
    enum: {
      values: [
        'damaged_received',
        'wrong_item_sent',
        'not_as_described',
        'changed_mind',
        'wrong_size',
        'quality_issues',
        'defective_item',
        'other'
      ],
      message: 'Please select a valid return reason'
    }
  },
  reasonDescription: {
    type: String,
    trim: true,
    maxlength: 500
  }
});

const returnRequestSchema = new mongoose.Schema({
  // Reference to original order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
    index: true
  },
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    trim: true,
    index: true
  },
  
  // Customer information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
    maxlength: 255
  },
  
  // Return request details
  returnRequestNumber: {
    type: String,
    required: [true, 'Return request number is required'],
    unique: true,
    trim: true
  },
  status: {
    type: String,
    required: [true, 'Return request status is required'],
    enum: {
      values: [
        'pending_review',
        'approved',
        'rejected',
        'item_received',
        'processing_refund',
        'refunded',
        'closed'
      ],
      message: 'Return request status must be one of: pending_review, approved, rejected, item_received, processing_refund, refunded, closed'
    },
    default: 'pending_review',
    index: true
  },
  
  // Items being returned
  items: {
    type: [returnItemSchema],
    required: [true, 'At least one item must be specified for return'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'At least one item must be specified for return'
    }
  },
  
  // Total refund calculation
  totalRefundAmount: {
    type: Number,
    required: [true, 'Total refund amount is required'],
    min: [0, 'Total refund amount cannot be negative']
  },
  
  // Supporting documentation
  images: [{
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    description: {
      type: String,
      trim: true,
      maxlength: 100
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Shipping information
  returnShippingAddress: {
    companyName: {
      type: String,
      default: 'Graphene Security Returns',
      trim: true
    },
    addressLine1: {
      type: String,
      default: '123 Return Processing Center',
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      default: 'London',
      trim: true
    },
    stateProvince: {
      type: String,
      default: 'England',
      trim: true
    },
    postalCode: {
      type: String,
      default: 'SW1A 1AA',
      trim: true
    },
    country: {
      type: String,
      default: 'GB',
      trim: true
    }
  },
  
  // Timeline tracking
  requestDate: {
    type: Date,
    required: [true, 'Request date is required'],
    default: Date.now,
    index: true
  },
  approvedDate: {
    type: Date
  },
  itemReceivedDate: {
    type: Date
  },
  refundProcessedDate: {
    type: Date
  },
  
  // Admin notes and processing
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Refund information
  refundId: {
    type: String,
    trim: true,
    maxlength: 255
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    trim: true
  },
  
  // Additional metadata
  returnWindow: {
    type: Number,
    default: 30, // 30 days return window
    min: 1,
    max: 365
  },
  isWithinReturnWindow: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
returnRequestSchema.index({ userId: 1, requestDate: -1 });
returnRequestSchema.index({ orderId: 1, status: 1 });
returnRequestSchema.index({ status: 1, requestDate: -1 });
// Index removed to prevent duplicate warning - uniqueness handled by schema field property

// Virtual for formatted return request number
returnRequestSchema.virtual('formattedRequestNumber').get(function() {
  return `RET-${this.returnRequestNumber}`;
});

// Virtual for total items count
returnRequestSchema.virtual('totalItemsCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-save middleware to generate return request number
returnRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.returnRequestNumber) {
    // Generate return request number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Find the count of return requests for today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const dailyCount = await this.constructor.countDocuments({
      requestDate: { $gte: startOfDay, $lt: endOfDay }
    });
    
    const sequence = String(dailyCount + 1).padStart(3, '0');
    this.returnRequestNumber = `${year}${month}${day}${sequence}`;
  }
  
  // Calculate total refund amount
  if (this.items && this.items.length > 0) {
    this.totalRefundAmount = this.items.reduce((total, item) => {
      return total + (item.unitPrice * item.quantity);
    }, 0);
  }
  
  next();
});

// Instance method to check if return request is within return window
returnRequestSchema.methods.checkReturnWindow = function(orderDeliveryDate) {
  if (!orderDeliveryDate) return false;
  
  const windowEnd = new Date(orderDeliveryDate);
  windowEnd.setDate(windowEnd.getDate() + this.returnWindow);
  
  return new Date() <= windowEnd;
};

// Instance method to format status for display
returnRequestSchema.methods.getFormattedStatus = function() {
  const statusMap = {
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    item_received: 'Item Received',
    processing_refund: 'Processing Refund',
    refunded: 'Refunded',
    closed: 'Closed'
  };
  return statusMap[this.status] || this.status;
};

// Static method to find return requests by user
returnRequestSchema.statics.findByUser = function(userId, options = {}) {
  const { page = 1, limit = 10, sortBy = 'requestDate', sortOrder = -1 } = options;
  const skip = (page - 1) * limit;
  
  return this.find({ userId })
    .populate('orderId', 'orderNumber orderDate')
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .exec();
};

// Static method to get return requests that need admin attention
returnRequestSchema.statics.findPendingReview = function() {
  return this.find({ status: 'pending_review' })
    .populate('userId', 'firstName lastName email')
    .populate('orderId', 'orderNumber orderDate')
    .sort({ requestDate: 1 })
    .exec();
};

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

export default ReturnRequest;