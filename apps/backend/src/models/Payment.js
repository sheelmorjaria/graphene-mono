import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Payment identifier
  paymentId: {
    type: String,
    required: [true, 'Payment ID is required'],
    trim: true,
    maxlength: 100
  },
  
  // Related entities
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  
  orderNumber: {
    type: String,
    required: [true, 'Order number is required'],
    trim: true,
    maxlength: 20
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    trim: true,
    lowercase: true,
    maxlength: 255
  },
  
  // Payment method and amounts
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['paypal', 'bitcoin', 'monero'],
    lowercase: true
  },
  
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    default: 'GBP',
    enum: ['GBP', 'USD', 'EUR', 'BTC', 'XMR']
  },
  
  // Payment status
  status: {
    type: String,
    required: [true, 'Payment status is required'],
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    default: 'pending',
    lowercase: true
  },
  
  // PayPal specific fields
  paypalOrderId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  paypalPaymentId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  paypalPayerId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  paypalTransactionId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  paypalPayerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 255
  },
  
  // Bitcoin specific fields
  bitcoinAddress: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  bitcoinAmount: {
    type: Number,
    min: 0
  },
  
  bitcoinExchangeRate: {
    type: Number,
    min: 0
  },
  
  bitcoinExchangeRateTimestamp: {
    type: Date
  },
  
  bitcoinTransactionHash: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  bitcoinConfirmations: {
    type: Number,
    min: 0,
    default: 0
  },
  
  bitcoinPaymentExpiry: {
    type: Date
  },
  
  bitcoinAmountReceived: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Monero specific fields
  moneroAddress: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  xmrAmount: {
    type: Number,
    min: 0
  },
  
  moneroExchangeRate: {
    type: Number,
    min: 0
  },
  
  exchangeRateValidUntil: {
    type: Date
  },
  
  globeePaymentId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  paymentUrl: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  expirationTime: {
    type: Date
  },
  
  confirmations: {
    type: Number,
    min: 0,
    default: 0
  },
  
  paidAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Transaction metadata
  transactionHash: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  transactionFee: {
    type: Number,
    min: 0,
    default: 0
  },
  
  networkFee: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Refund information
  refundAmount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  refundReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  refundDate: {
    type: Date
  },
  
  refundTransactionId: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Error handling
  failureReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  lastError: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  retryCount: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  
  completedAt: {
    type: Date
  },
  
  cancelledAt: {
    type: Date
  },
  
  // Gateway response data (for debugging)
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Webhook data
  webhookData: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    event: {
      type: String,
      trim: true,
      maxlength: 100
    },
    data: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // IP address for fraud detection
  ipAddress: {
    type: String,
    trim: true,
    maxlength: 45
  },
  
  // User agent for tracking
  userAgent: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Indexes for efficient querying
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ paymentMethod: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ customerEmail: 1 });
paymentSchema.index({ paymentId: 1 }, { unique: true });

// Compound indexes for reports
paymentSchema.index({ createdAt: 1, status: 1, paymentMethod: 1 });
paymentSchema.index({ completedAt: 1, status: 1 });

// Instance methods
paymentSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

paymentSchema.methods.isPending = function() {
  return this.status === 'pending' || this.status === 'processing';
};

paymentSchema.methods.canBeRefunded = function() {
  return this.status === 'completed' && this.refundAmount < this.amount;
};

paymentSchema.methods.getRefundableAmount = function() {
  return Math.max(0, this.amount - this.refundAmount);
};

paymentSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

paymentSchema.methods.addWebhookData = function(event, data) {
  this.webhookData.push({
    event: event,
    data: data,
    timestamp: new Date()
  });
  return this.save();
};

// Static methods
paymentSchema.statics.findByOrderId = function(orderId) {
  return this.find({ orderId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findPendingPayments = function() {
  return this.find({ 
    status: { $in: ['pending', 'processing'] }
  }).sort({ createdAt: -1 });
};

paymentSchema.statics.findCompletedPayments = function(startDate, endDate) {
  const query = { status: 'completed' };
  
  if (startDate || endDate) {
    query.completedAt = {};
    if (startDate) query.completedAt.$gte = startDate;
    if (endDate) query.completedAt.$lte = endDate;
  }
  
  return this.find(query).sort({ completedAt: -1 });
};

paymentSchema.statics.getPaymentStats = function(startDate, endDate) {
  const matchStage = { status: 'completed' };
  
  if (startDate || endDate) {
    matchStage.completedAt = {};
    if (startDate) matchStage.completedAt.$gte = startDate;
    if (endDate) matchStage.completedAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Generate payment ID if not set
  if (!this.paymentId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.paymentId = `PAY-${timestamp}-${random}`.toUpperCase();
  }
  
  // Validate payment method specific fields
  if (this.paymentMethod === 'bitcoin' && this.bitcoinAmount && this.bitcoinExchangeRate) {
    // Ensure bitcoin amount matches the GBP amount at the exchange rate
    const expectedGbpAmount = this.bitcoinAmount * this.bitcoinExchangeRate;
    if (Math.abs(expectedGbpAmount - this.amount) > 0.01) {
      return next(new Error('Bitcoin amount does not match GBP amount at current exchange rate'));
    }
  }
  
  if (this.paymentMethod === 'monero' && this.xmrAmount && this.moneroExchangeRate) {
    // Ensure Monero amount matches the GBP amount at the exchange rate
    const expectedGbpAmount = this.xmrAmount * this.moneroExchangeRate;
    if (Math.abs(expectedGbpAmount - this.amount) > 0.01) {
      return next(new Error('Monero amount does not match GBP amount at current exchange rate'));
    }
  }
  
  next();
});

// Post-save middleware for logging
paymentSchema.post('save', (doc) => {
  if (doc.isModified('status')) {
    console.log(`Payment ${doc.paymentId} status changed to: ${doc.status}`);
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;