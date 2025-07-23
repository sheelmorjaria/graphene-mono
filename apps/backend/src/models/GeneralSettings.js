import mongoose from 'mongoose';

const generalSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    default: 'GrapheneOS Store'
  },
  storeEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address'],
    default: 'support@grapheneos-store.com'
  },
  storePhone: {
    type: String,
    trim: true,
    maxlength: 20,
    default: '+44 20 1234 5678'
  },
  storeAddress: {
    street: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '123 Privacy Street'
    },
    city: {
      type: String,
      trim: true,
      maxlength: 50,
      default: 'London'
    },
    postalCode: {
      type: String,
      trim: true,
      maxlength: 20,
      default: 'SW1A 1AA'
    },
    country: {
      type: String,
      trim: true,
      maxlength: 2,
      uppercase: true,
      match: [/^[A-Z]{2}$/, 'Country must be a valid ISO 3166-1 alpha-2 code'],
      default: 'GB'
    }
  },
  defaultCurrency: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 3,
    match: [/^[A-Z]{3}$/, 'Currency must be a valid ISO 4217 currency code'],
    default: 'GBP'
  },
  defaultLanguage: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 5,
    match: [/^[a-z]{2}(-[a-z]{2})?$/, 'Language must be a valid ISO 639-1 language code'],
    default: 'en-gb'
  },
  businessRegistrationNumber: {
    type: String,
    trim: true,
    maxlength: 50,
    default: ''
  },
  vatNumber: {
    type: String,
    trim: true,
    maxlength: 20,
    default: ''
  },
  timezone: {
    type: String,
    trim: true,
    maxlength: 50,
    default: 'Europe/London'
  },
  dateFormat: {
    type: String,
    trim: true,
    enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
    default: 'DD/MM/YYYY'
  },
  timeFormat: {
    type: String,
    trim: true,
    enum: ['12', '24'],
    default: '24'
  },
  isMaintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    trim: true,
    maxlength: 500,
    default: 'We are currently performing scheduled maintenance. Please check back soon.'
  }
}, {
  timestamps: true,
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.__v;
      return ret;
    }
  },
  toObject: { getters: true }
});

// Ensure only one settings document exists
generalSettingsSchema.index({}, { unique: true });

// Virtual for full store address
generalSettingsSchema.virtual('fullAddress').get(function() {
  const addr = this.storeAddress;
  const parts = [addr.street, addr.city, addr.postalCode].filter(Boolean);
  return parts.join(', ');
});

// Virtual for formatted phone
generalSettingsSchema.virtual('formattedPhone').get(function() {
  if (!this.storePhone) return '';
  
  // Basic UK phone number formatting
  let phone = this.storePhone.replace(/\D/g, '');
  if (phone.startsWith('44')) {
    phone = '+44 ' + phone.slice(2, 4) + ' ' + phone.slice(4, 8) + ' ' + phone.slice(8);
  }
  return phone || this.storePhone;
});

// Static method to get current settings (creates default if none exist)
generalSettingsSchema.statics.getCurrentSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = new this({});
    await settings.save();
  }
  
  return settings;
};

// Static method to update settings
generalSettingsSchema.statics.updateSettings = async function(updates) {
  let settings = await this.findOne();
  
  if (!settings) {
    // Create new settings with updates
    settings = new this(updates);
  } else {
    // Update existing settings
    Object.assign(settings, updates);
  }
  
  await settings.save();
  return settings;
};

// Pre-save validation
generalSettingsSchema.pre('save', function(next) {
  // Validate that postal code matches country format
  if (this.storeAddress.country === 'GB' && this.storeAddress.postalCode) {
    const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})$/i;
    if (!ukPostcodeRegex.test(this.storeAddress.postalCode)) {
      return next(new Error('Invalid UK postcode format'));
    }
  }
  
  next();
});

const GeneralSettings = mongoose.model('GeneralSettings', generalSettingsSchema);

export default GeneralSettings;