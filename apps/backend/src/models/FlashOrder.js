import mongoose from 'mongoose';

const flashOrderSchema = new mongoose.Schema({
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
  pixelModel: {
    type: String,
    required: [true, 'Pixel model is required'],
    enum: {
      values: [
        'Pixel 6', 'Pixel 6 Pro', 'Pixel 6a',
        'Pixel 7', 'Pixel 7 Pro', 'Pixel 7a',
        'Pixel 8', 'Pixel 8 Pro', 'Pixel 8a',
        'Pixel Fold',
        'Pixel 9', 'Pixel 9 Pro XL', 'Pixel 9a',
        'Pixel 10', 'Pixel 10a', 'Pixel 10 Pro', 'Pixel 10 Pro XL', 'Pixel 10 Pro Fold'
      ],
      message: 'Invalid Pixel model. Only supported Pixel models are accepted.'
    }
  },
  returnAddress: {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    stateProvince: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      default: 'GB'
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: 20
    }
  },
  factoryResetConfirmed: {
    type: Boolean,
    required: [true, 'Factory reset confirmation is required'],
    default: false
  },
  // UK CCR 2013: consumer must expressly consent to the service beginning
  // and acknowledge losing the cancel-right once it is fully performed.
  // Controller-enforced (like factoryResetConfirmed) but deliberately NOT
  // schema-required — existing production documents lack the field and a
  // `required` validator would fail every future save of those docs.
  serviceConsentConfirmed: {
    type: Boolean,
    default: false
  },
  // Inbound inspection at Device_Received — the chargeback paper trail for
  // pre-existing damage claims
  intakeInspection: {
    inspectedAt: { type: Date },
    conditionNotes: { type: String, trim: true, maxlength: 2000 },
    inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  // Refund ledger (tiered flash-service refund policy)
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
    category: {
      type: String,
      enum: {
        values: ['cancellation_before_flashing', 'device_unflashable'],
        message: 'Refund category must be one of: cancellation_before_flashing, device_unflashable'
      }
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
    enum: ['Awaiting_Payment', 'Paid', 'Device_Received', 'Flashing_In_Progress', 'Shipped_Back', 'Cancelled', 'Refunded'],
    default: 'Awaiting_Payment'
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Unpaid', 'Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Unpaid'
  },
  // Pricing fields
  basePrice: {
    type: Number,
    default: 119.99
  },
  returnShipping: {
    type: Number,
    default: 20.45
  },
  shippingRegion: {
    type: String,
    enum: ['uk', 'europe', 'world'],
    default: 'uk'
  },
  totalPrice: {
    type: Number,
    default: 140.44, // 119.99 + 20.45
    min: [0, 'Total price cannot be negative']
  },
  // PO Box address - ONLY revealed after payment
  poBoxAddress: {
    type: {
      recipientName: { type: String, trim: true },
      poBoxName: { type: String, trim: true },
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
      instructions: { type: String, trim: true }
    },
    default: undefined
  },
  // PayPal payment details
  paymentDetails: {
    paypalOrderId: { type: String, trim: true },
    paypalPaymentId: { type: String, trim: true },
    paypalPayerId: { type: String, trim: true },
    paypalTransactionId: { type: String, trim: true },
    paypalPayerEmail: { type: String, trim: true }
  },
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

// Pre-save hook to generate order number and calculate total price
flashOrderSchema.pre('save', async function(next) {
  // Generate order number if not set
  if (!this.orderNumber) {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `FLO-${timestamp}-${randomSuffix}`;
  }

  // Calculate total price if not set
  if (this.totalPrice === undefined || this.totalPrice === null) {
    const base = this.basePrice ?? 119.99;
    const shipping = this.returnShipping ?? 20.45;
    this.totalPrice = base + shipping;
  }

  next();
});

export default mongoose.model('FlashOrder', flashOrderSchema);
