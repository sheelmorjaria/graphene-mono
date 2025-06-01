import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100
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
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: 100
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: 100
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: 100
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: 50
  },
  stateProvince: {
    type: String,
    required: [true, 'State/Province is required'],
    trim: true,
    maxlength: 50
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true,
    maxlength: 20
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    maxlength: 50
  },
  phoneNumber: {
    type: String,
    trim: true,
    maxlength: 20
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    trim: true,
    maxlength: 20
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true,
    maxlength: 255
  },
  status: {
    type: String,
    required: [true, 'Order status is required'],
    enum: {
      values: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      message: 'Status must be one of: pending, processing, shipped, delivered, cancelled'
    },
    default: 'pending'
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: [true, 'Tax amount is required'],
    min: [0, 'Tax cannot be negative'],
    default: 0
  },
  shipping: {
    type: Number,
    required: [true, 'Shipping cost is required'],
    min: [0, 'Shipping cost cannot be negative'],
    default: 0
  },
  totalAmount: {
    type: Number,
    min: [0, 'Total amount cannot be negative']
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: [true, 'Shipping address is required']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
      message: 'Payment method must be one of: credit_card, debit_card, paypal, bank_transfer'
    }
  },
  paymentStatus: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: {
      values: ['pending', 'completed', 'failed', 'refunded'],
      message: 'Payment status must be one of: pending, completed, failed, refunded'
    },
    default: 'pending'
  },
  orderDate: {
    type: Date,
    required: [true, 'Order date is required'],
    default: Date.now,
    index: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound index for efficient querying by user and date
orderSchema.index({ userId: 1, orderDate: -1 });

// Pre-save middleware to generate order number and calculate total
orderSchema.pre('save', function(next) {
  // Generate order number if not provided
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}-${randomSuffix}`;
  }
  
  // Calculate totalAmount from subtotal, tax, and shipping if not provided
  if (!this.totalAmount) {
    this.totalAmount = this.subtotal + this.tax + this.shipping;
  }
  
  next();
});

// Instance method to format order status for display
orderSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return statusMap[this.status] || this.status;
};

// Instance method to get formatted order date
orderSchema.methods.getFormattedDate = function() {
  return this.orderDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Static method to find orders by user with pagination
orderSchema.statics.findByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'orderDate',
    sortOrder = -1
  } = options;
  
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };
  
  return this.find({ userId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('orderNumber orderDate totalAmount status customerEmail items.length');
};

// Static method to count orders by user
orderSchema.statics.countByUser = function(userId) {
  return this.countDocuments({ userId });
};

const Order = mongoose.model('Order', orderSchema);

export default Order;