import mongoose from 'mongoose';

// Aegis Hardening Suite licence orders (£99 one-off, digital delivery by
// email — no shipping address, no physical device intake). Mirrors
// FlashOrder's shape minus the mail-in logistics.
const aegisOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    trim: true,
    maxlength: 255
  },
  // Bare catalog baseModel ("7 Pro", "10 Pro Fold") matching Product.baseModel.
  // No static enum on purpose: the catalog is live (daily price sync) and the
  // controller validates against Product.exists at creation time.
  pixelModel: {
    type: String,
    required: [true, 'Pixel model is required'],
    trim: true,
    maxlength: 100
  },
  amountGbp: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
    default: 99.00
  },
  // Refund ledger (full-amount refunds only — no tiered categories needed
  // for a digital licence)
  totalRefundedAmount: {
    type: Number,
    min: [0, 'Total refunded amount cannot be negative'],
    default: 0
  },
  refundHistory: [{
    refundId: {
      type: String,
      required: [true, 'Refund ID is required'],
      trim: true,
      maxlength: 255
    },
    amount: {
      type: Number,
      required: [true, 'Refund amount is required'],
      min: [0, 'Refund amount cannot be negative']
    },
    date: {
      type: Date,
      required: [true, 'Refund date is required'],
      default: Date.now
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    adminUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'succeeded', 'failed'],
        message: 'Refund status must be one of: pending, succeeded, failed'
      },
      default: 'pending'
    }
  }],
  orderStatus: {
    type: String,
    required: true,
    enum: ['Awaiting_Payment', 'Paid', 'Fulfilled', 'Cancelled', 'Refunded'],
    default: 'Awaiting_Payment'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Unpaid', 'Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Unpaid'
  },
  // PayPal payment details
  paymentDetails: {
    paypalOrderId: { type: String, trim: true },
    paypalPayerId: { type: String, trim: true },
    paypalTransactionId: { type: String, trim: true },
    paypalPayerEmail: { type: String, trim: true }
  },
  // Automated delivery: unguessable per-order token for the installer-kit
  // download link (generated at capture). The token stays valid for the
  // lifetime of the licence; refunds/cancellations revoke it via the
  // status check in the download handler.
  downloadToken: {
    type: String,
    index: { unique: true, sparse: true },
    trim: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDownloadedAt: { type: Date },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200
    }
  }]
}, {
  timestamps: true,
  toJSON: { getters: true }
});

// Pre-save hook to generate order number
aegisOrderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `AEG-${timestamp}-${randomSuffix}`;
  }
  next();
});

export default mongoose.model('AegisOrder', aegisOrderSchema);
