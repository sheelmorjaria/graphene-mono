import mongoose from 'mongoose';

const returnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalRefundAmount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: ['defective', 'wrong_item', 'not_as_described', 'damaged_shipping', 'other']
    },
    description: {
      type: String,
      maxlength: 500
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'label_uploaded', 'in_transit', 'received', 'processed', 'refunded'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  refundAmount: {
    type: Number,
    required: true
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },
  images: [{
    url: String,
    description: String
  }],
  returnLabel: {
    url: String,
    trackingNumber: String,
    carrier: String,
    uploadedAt: Date
  },
  receivedDate: Date,
  processedDate: Date,
  refundedDate: Date
}, {
  timestamps: true
});

// Generate return number
returnSchema.pre('save', async function(next) {
  if (this.isNew && !this.returnNumber) {
    const count = await this.constructor.countDocuments();
    this.returnNumber = `RET-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for formatted return number
returnSchema.virtual('formattedReturnNumber').get(function() {
  return this.returnNumber;
});

// Method to check if return is within eligibility window
returnSchema.methods.isWithinReturnWindow = function() {
  if (!this.createdAt) return false;
  const returnWindowDays = 30;
  const eligibilityEnd = new Date(this.createdAt);
  eligibilityEnd.setDate(eligibilityEnd.getDate() + returnWindowDays);
  return new Date() <= eligibilityEnd;
};

// Static method to find returns by user
returnSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).populate('orderId', 'orderNumber').sort({ createdAt: -1 });
};

const Return = mongoose.model('Return', returnSchema);

export default Return;