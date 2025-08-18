import mongoose from 'mongoose';

const emailPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Transactional emails (always sent, cannot be disabled)
  transactional: {
    orderConfirmation: { type: Boolean, default: true, immutable: true },
    paymentConfirmation: { type: Boolean, default: true, immutable: true },
    shippingNotification: { type: Boolean, default: true, immutable: true },
    returnConfirmation: { type: Boolean, default: true, immutable: true },
    accountSecurity: { type: Boolean, default: true, immutable: true }
  },
  
  // Optional notification emails
  notifications: {
    orderStatusUpdates: { type: Boolean, default: true },
    deliveryUpdates: { type: Boolean, default: true },
    priceDropAlerts: { type: Boolean, default: false },
    backInStockAlerts: { type: Boolean, default: false },
    newProductAlerts: { type: Boolean, default: false }
  },
  
  // Marketing emails (if implemented in future)
  marketing: {
    promotions: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: false },
    productRecommendations: { type: Boolean, default: false },
    surveyInvitations: { type: Boolean, default: false }
  },
  
  // Email delivery status
  emailStatus: {
    isValid: { type: Boolean, default: true },
    isBounced: { type: Boolean, default: false },
    isComplained: { type: Boolean, default: false },
    lastBounceDate: { type: Date, default: null },
    lastComplaintDate: { type: Date, default: null },
    lastBounceReason: { type: String, default: null },
    lastComplaintReason: { type: String, default: null },
    bounceCount: { type: Number, default: 0 },
    complaintCount: { type: Number, default: 0 },
    lastValidatedAt: { type: Date, default: null }
  },
  
  // Unsubscribe token
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Global unsubscribe (stops all non-transactional emails)
  globalUnsubscribe: {
    type: Boolean,
    default: false
  },
  
  // Audit trail
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  updateHistory: [{
    timestamp: { type: Date, default: Date.now },
    changes: { type: Map, of: mongoose.Schema.Types.Mixed },
    source: { type: String, enum: ['user', 'admin', 'system', 'webhook'], required: true },
    reason: String
  }]
  
}, {
  timestamps: true
});

// Indexes
emailPreferenceSchema.index({ userId: 1 });
emailPreferenceSchema.index({ unsubscribeToken: 1 });
emailPreferenceSchema.index({ 'emailStatus.isBounced': 1 });
emailPreferenceSchema.index({ 'emailStatus.isComplained': 1 });

// Methods
emailPreferenceSchema.methods.canSendEmail = function(emailType) {
  // Never send to bounced or complained emails
  if (this.emailStatus.isBounced || this.emailStatus.isComplained) {
    return false;
  }
  
  // Always send transactional emails unless globally unsubscribed
  if (emailType.startsWith('transactional.')) {
    return true;
  }
  
  // Check global unsubscribe
  if (this.globalUnsubscribe) {
    return false;
  }
  
  // Check specific preference
  const [category, type] = emailType.split('.');
  if (this[category] && this[category][type] !== undefined) {
    return this[category][type];
  }
  
  // Default to not sending if preference not found
  return false;
};

emailPreferenceSchema.methods.recordBounce = function(bounceType, reason) {
  this.emailStatus.isBounced = true;
  this.emailStatus.lastBounceDate = new Date();
  this.emailStatus.lastBounceReason = reason;
  this.emailStatus.bounceCount += 1;
  
  this.updateHistory.push({
    changes: new Map([
      ['emailStatus.isBounced', true],
      ['emailStatus.bounceCount', this.emailStatus.bounceCount],
      ['emailStatus.lastBounceReason', reason]
    ]),
    source: 'webhook',
    reason: `Bounce: ${bounceType} - ${reason}`
  });
  
  return this.save();
};

emailPreferenceSchema.methods.recordComplaint = function(complaintType, reason) {
  this.emailStatus.isComplained = true;
  this.emailStatus.lastComplaintDate = new Date();
  this.emailStatus.lastComplaintReason = reason;
  this.emailStatus.complaintCount += 1;
  
  // Auto-unsubscribe from all marketing on complaint
  this.marketing = {
    promotions: false,
    newsletter: false,
    productRecommendations: false,
    surveyInvitations: false
  };
  
  // Also disable non-essential notifications
  this.notifications.priceDropAlerts = false;
  this.notifications.backInStockAlerts = false;
  this.notifications.newProductAlerts = false;
  
  this.updateHistory.push({
    changes: new Map([
      ['emailStatus.isComplained', true],
      ['emailStatus.complaintCount', this.emailStatus.complaintCount],
      ['emailStatus.lastComplaintReason', reason],
      ['marketing', this.marketing],
      ['notifications.priceDropAlerts', false],
      ['notifications.backInStockAlerts', false],
      ['notifications.newProductAlerts', false]
    ]),
    source: 'webhook',
    reason: `Complaint: ${complaintType} - ${reason}`
  });
  
  return this.save();
};

emailPreferenceSchema.methods.updatePreferences = function(updates, source = 'user') {
  const changes = new Map();
  
  // Update notifications
  if (updates.notifications) {
    Object.keys(updates.notifications).forEach(key => {
      if (this.notifications[key] !== undefined) {
        this.notifications[key] = updates.notifications[key];
        changes.set(`notifications.${key}`, updates.notifications[key]);
      }
    });
  }
  
  // Update marketing
  if (updates.marketing) {
    Object.keys(updates.marketing).forEach(key => {
      if (this.marketing[key] !== undefined) {
        this.marketing[key] = updates.marketing[key];
        changes.set(`marketing.${key}`, updates.marketing[key]);
      }
    });
  }
  
  // Update global unsubscribe
  if (updates.globalUnsubscribe !== undefined) {
    this.globalUnsubscribe = updates.globalUnsubscribe;
    changes.set('globalUnsubscribe', updates.globalUnsubscribe);
  }
  
  this.lastUpdated = new Date();
  this.updateHistory.push({
    changes,
    source,
    reason: updates.reason || 'User preference update'
  });
  
  return this.save();
};

// Statics
emailPreferenceSchema.statics.createDefaultPreferences = async function(userId) {
  const crypto = await import('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  return this.create({
    userId,
    unsubscribeToken: token
  });
};

emailPreferenceSchema.statics.findByUnsubscribeToken = function(token) {
  return this.findOne({ unsubscribeToken: token });
};

const EmailPreference = mongoose.model('EmailPreference', emailPreferenceSchema);

export default EmailPreference;