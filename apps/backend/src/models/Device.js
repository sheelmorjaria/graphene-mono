import mongoose from 'mongoose';

// Physical phone unit tracked by IMEI across its lifecycle
// (in_stock → allocated → shipped → returned / quarantined).
// The Device collection is the source of truth; an immutable snapshot
// ({deviceId, imei}) is copied onto the order item at allocation time.
const deviceSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: [true, 'IMEI is required'],
    unique: true,
    trim: true,
    validate: {
      validator: (v) => /^\d{15}$/.test(v),
      message: (props) => `${props.value} is not a valid 15-digit IMEI`
    }
  },
  serialNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
    index: true
  },
  // Denormalised from the product variation at receive/allocation time so
  // device lists and return verification don't need a product join
  productName: {
    type: String,
    trim: true,
    maxlength: 200
  },
  variationId: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    trim: true,
    maxlength: 100
  },
  status: {
    type: String,
    enum: {
      values: ['in_stock', 'allocated', 'shipped', 'returned', 'quarantined'],
      message: 'Device status must be one of: in_stock, allocated, shipped, returned, quarantined'
    },
    default: 'in_stock'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
    index: true
  },
  // The specific order line (order.items[i]._id) this unit is allocated to
  orderItemId: {
    type: String,
    trim: true
  },
  orderNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  allocatedAt: {
    type: Date
  },
  allocatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shippedAt: {
    type: Date
  },
  // History of return verifications involving this device
  returnHistory: [{
    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      required: [true, 'Return request ID is required']
    },
    outcome: {
      type: String,
      enum: {
        values: ['match', 'mismatch'],
        message: 'Return outcome must be one of: match, mismatch'
      },
      required: [true, 'Return outcome is required']
    },
    scannedImei: {
      type: String,
      trim: true
    },
    expectedImeis: [{
      type: String
    }],
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Lookup patterns: device list filtering, order-device joins
deviceSchema.index({ productId: 1, variationId: 1 });
deviceSchema.index({ status: 1, createdAt: -1 });

const Device = mongoose.model('Device', deviceSchema);
export default Device;
