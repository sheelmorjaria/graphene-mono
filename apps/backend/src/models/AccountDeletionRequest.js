import mongoose from 'mongoose';

const accountDeletionRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'],
    default: 'pending',
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  userEmail: {
    type: String,
    required: true // Store email as user record will be deleted
  },
  userName: {
    type: String,
    required: true // Store name as user record will be deleted
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  passwordVerified: {
    type: Boolean,
    default: false
  },
  deletionType: {
    type: String,
    enum: ['soft', 'hard'], // soft = anonymize, hard = full deletion
    default: 'soft'
  },
  dataRetained: {
    orders: { type: Boolean, default: true }, // Retain for legal purposes
    transactions: { type: Boolean, default: true },
    supportTickets: { type: Boolean, default: false }
  },
  errorMessage: {
    type: String
  },
  adminNotes: {
    type: String
  },
  processingMetadata: {
    ordersAnonymized: Number,
    recordsDeleted: Number,
    processingTimeMs: Number,
    dataRetentionPolicyVersion: String
  }
}, {
  timestamps: true
});

// Indexes
accountDeletionRequestSchema.index({ requestedAt: -1 });
accountDeletionRequestSchema.index({ status: 1, requestedAt: -1 });

// Static methods
accountDeletionRequestSchema.statics.createRequest = function(userId, userEmail, userName, ipAddress, userAgent) {
  const requestId = `deletion_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new this({
    userId,
    requestId,
    userEmail,
    userName,
    ipAddress,
    userAgent,
    status: 'pending',
    passwordVerified: true // Will be set after password verification
  });
};

accountDeletionRequestSchema.statics.findPendingRequests = function() {
  return this.find({
    status: 'pending'
  }).sort({ requestedAt: 1 }); // Oldest first
};

accountDeletionRequestSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ requestedAt: -1 });
};

// Instance methods
accountDeletionRequestSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

accountDeletionRequestSchema.methods.markAsCompleted = function(processingMetadata = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (processingMetadata) {
    this.processingMetadata = {
      ...this.processingMetadata,
      ...processingMetadata
    };
  }
  return this.save();
};

accountDeletionRequestSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

accountDeletionRequestSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.adminNotes = reason;
  return this.save();
};

// Pre-save middleware to ensure data retention policies are applied
accountDeletionRequestSchema.pre('save', function(next) {
  // Ensure legal data retention requirements are met
  if (this.isModified('dataRetained')) {
    // Orders and transactions must be retained for legal/tax purposes
    this.dataRetained.orders = true;
    this.dataRetained.transactions = true;
  }
  next();
});

export default mongoose.model('AccountDeletionRequest', accountDeletionRequestSchema);