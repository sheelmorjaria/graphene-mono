import mongoose from 'mongoose';

const emailMetricsSchema = new mongoose.Schema({
  // Email identification
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Email details
  emailType: {
    type: String,
    required: true,
    index: true
  },
  
  recipient: {
    type: String,
    required: true,
    index: true
  },
  
  subject: {
    type: String,
    required: true
  },
  
  // Associated data
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  
  // Timestamps
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Delivery status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'bounced', 'complained', 'failed'],
    default: 'pending',
    index: true
  },
  
  // Events
  events: [{
    type: {
      type: String,
      enum: ['sent', 'delivered', 'bounced', 'complained', 'opened', 'clicked', 'failed'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  
  // Engagement metrics
  engagement: {
    opened: { type: Boolean, default: false },
    openedAt: { type: Date },
    openCount: { type: Number, default: 0 },
    clicked: { type: Boolean, default: false },
    clickedAt: { type: Date },
    clickCount: { type: Number, default: 0 },
    clickedLinks: [{
      url: String,
      clickedAt: Date
    }]
  },
  
  // Error tracking
  error: {
    hasError: { type: Boolean, default: false },
    errorMessage: String,
    errorCode: String,
    errorAt: Date
  },
  
  // Metadata
  metadata: {
    sesMessageId: String,
    provider: { type: String, default: 'ses' },
    campaignId: String,
    tags: [String]
  }
  
}, {
  timestamps: true
});

// Indexes for common queries
emailMetricsSchema.index({ sentAt: -1 });
emailMetricsSchema.index({ emailType: 1, sentAt: -1 });
emailMetricsSchema.index({ recipient: 1, sentAt: -1 });
emailMetricsSchema.index({ status: 1, sentAt: -1 });
emailMetricsSchema.index({ 'engagement.opened': 1 });
emailMetricsSchema.index({ 'error.hasError': 1 });

// Instance methods
emailMetricsSchema.methods.recordEvent = function(eventType, details = {}) {
  this.events.push({
    type: eventType,
    timestamp: new Date(),
    details
  });
  
  // Update status based on event
  switch(eventType) {
    case 'sent':
      this.status = 'sent';
      break;
    case 'delivered':
      this.status = 'delivered';
      break;
    case 'bounced':
      this.status = 'bounced';
      break;
    case 'complained':
      this.status = 'complained';
      break;
    case 'failed':
      this.status = 'failed';
      this.error.hasError = true;
      this.error.errorMessage = details.error || 'Unknown error';
      this.error.errorAt = new Date();
      break;
    case 'opened':
      this.engagement.opened = true;
      if (!this.engagement.openedAt) {
        this.engagement.openedAt = new Date();
      }
      this.engagement.openCount += 1;
      break;
    case 'clicked':
      this.engagement.clicked = true;
      if (!this.engagement.clickedAt) {
        this.engagement.clickedAt = new Date();
      }
      this.engagement.clickCount += 1;
      if (details.url) {
        this.engagement.clickedLinks.push({
          url: details.url,
          clickedAt: new Date()
        });
      }
      break;
  }
  
  return this.save();
};

// Static methods for analytics
emailMetricsSchema.statics.getDeliveryStats = async function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.sentAt = {};
    if (startDate) match.sentAt.$gte = startDate;
    if (endDate) match.sentAt.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    total: 0,
    sent: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    failed: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });
  
  // Calculate rates
  if (result.total > 0) {
    result.deliveryRate = ((result.delivered / result.total) * 100).toFixed(2);
    result.bounceRate = ((result.bounced / result.total) * 100).toFixed(2);
    result.complaintRate = ((result.complained / result.total) * 100).toFixed(2);
  }
  
  return result;
};

emailMetricsSchema.statics.getEngagementStats = async function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.sentAt = {};
    if (startDate) match.sentAt.$gte = startDate;
    if (endDate) match.sentAt.$lte = endDate;
  }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSent: { $sum: 1 },
        totalOpened: {
          $sum: { $cond: ['$engagement.opened', 1, 0] }
        },
        totalClicked: {
          $sum: { $cond: ['$engagement.clicked', 1, 0] }
        },
        totalOpenCount: { $sum: '$engagement.openCount' },
        totalClickCount: { $sum: '$engagement.clickCount' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalSent: 0,
      openRate: '0.00',
      clickRate: '0.00',
      clickToOpenRate: '0.00'
    };
  }
  
  const result = stats[0];
  result.openRate = result.totalSent > 0 
    ? ((result.totalOpened / result.totalSent) * 100).toFixed(2)
    : '0.00';
  result.clickRate = result.totalSent > 0
    ? ((result.totalClicked / result.totalSent) * 100).toFixed(2)
    : '0.00';
  result.clickToOpenRate = result.totalOpened > 0
    ? ((result.totalClicked / result.totalOpened) * 100).toFixed(2)
    : '0.00';
    
  delete result._id;
  return result;
};

emailMetricsSchema.statics.getTopPerformingEmails = async function(limit = 10) {
  return this.find({ 'engagement.clicked': true })
    .sort({ 'engagement.clickCount': -1 })
    .limit(limit)
    .select('subject emailType engagement.clickCount engagement.openCount recipient sentAt');
};

emailMetricsSchema.statics.getEmailTypeStats = async function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.sentAt = {};
    if (startDate) match.sentAt.$gte = startDate;
    if (endDate) match.sentAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$emailType',
        count: { $sum: 1 },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        opened: {
          $sum: { $cond: ['$engagement.opened', 1, 0] }
        },
        clicked: {
          $sum: { $cond: ['$engagement.clicked', 1, 0] }
        }
      }
    },
    {
      $project: {
        emailType: '$_id',
        count: 1,
        delivered: 1,
        opened: 1,
        clicked: 1,
        deliveryRate: {
          $cond: [
            { $gt: ['$count', 0] },
            { $multiply: [{ $divide: ['$delivered', '$count'] }, 100] },
            0
          ]
        },
        openRate: {
          $cond: [
            { $gt: ['$delivered', 0] },
            { $multiply: [{ $divide: ['$opened', '$delivered'] }, 100] },
            0
          ]
        },
        clickRate: {
          $cond: [
            { $gt: ['$opened', 0] },
            { $multiply: [{ $divide: ['$clicked', '$opened'] }, 100] },
            0
          ]
        }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const EmailMetrics = mongoose.model('EmailMetrics', emailMetricsSchema);

export default EmailMetrics;