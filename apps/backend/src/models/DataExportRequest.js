import mongoose from 'mongoose';

const dataExportRequestSchema = new mongoose.Schema({
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
    enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
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
  expiresAt: {
    type: Date
  },
  downloadUrl: {
    type: String
  },
  fileSize: {
    type: Number
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloadAt: {
    type: Date
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  errorMessage: {
    type: String
  },
  metadata: {
    dataTypes: [String], // ['profile', 'orders', 'addresses', etc.]
    totalRecords: Number,
    processingTimeMs: Number
  }
}, {
  timestamps: true
});

// Index for cleanup of expired requests
dataExportRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
dataExportRequestSchema.statics.createRequest = function(userId, ipAddress, userAgent) {
  const requestId = `export_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new this({
    userId,
    requestId,
    ipAddress,
    userAgent,
    status: 'pending'
  });
};

dataExportRequestSchema.statics.findActiveByUserId = function(userId) {
  return this.find({
    userId,
    status: { $in: ['pending', 'processing', 'completed'] },
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  }).sort({ requestedAt: -1 });
};

// Instance methods
dataExportRequestSchema.methods.markAsProcessing = function() {
  this.status = 'processing';
  this.processedAt = new Date();
  return this.save();
};

dataExportRequestSchema.methods.markAsCompleted = function(downloadUrl, fileSize, expirationHours = 48) {
  this.status = 'completed';
  this.downloadUrl = downloadUrl;
  this.fileSize = fileSize;
  this.expiresAt = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
  return this.save();
};

dataExportRequestSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

dataExportRequestSchema.methods.recordDownload = function() {
  this.downloadCount += 1;
  this.lastDownloadAt = new Date();
  return this.save();
};

export default mongoose.model('DataExportRequest', dataExportRequestSchema);