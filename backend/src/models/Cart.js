import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 100
  },
  productSlug: {
    type: String,
    required: [true, 'Product slug is required'],
    trim: true
  },
  productImage: {
    type: String,
    trim: true,
    maxlength: 500
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [99, 'Quantity cannot exceed 99']
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true, // Allow null for guest carts
    index: true
  },
  sessionId: {
    type: String,
    sparse: true, // Allow null for authenticated user carts
    index: true,
    maxlength: 255
  },
  items: {
    type: [cartItemSchema],
    default: [],
    validate: {
      validator: function(items) {
        return items.length <= 50; // Reasonable cart size limit
      },
      message: 'Cart cannot contain more than 50 different items'
    }
  },
  totalItems: {
    type: Number,
    default: 0,
    min: [0, 'Total items cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  appliedPromotion: {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    code: {
      type: String,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed_amount', 'free_shipping']
    },
    value: Number,
    discountAmount: {
      type: Number,
      min: 0
    }
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient querying
cartSchema.index({ userId: 1, updatedAt: -1 });
cartSchema.index({ sessionId: 1, updatedAt: -1 });

// Pre-save middleware to calculate totals and update lastModified
cartSchema.pre('save', function(next) {
  // Calculate totals from items
  this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);
  this.totalAmount = this.items.reduce((total, item) => total + item.subtotal, 0);
  this.lastModified = new Date();
  
  // Calculate subtotal for each item
  this.items.forEach(item => {
    item.subtotal = item.unitPrice * item.quantity;
  });
  
  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = function(productData, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === productData._id.toString()
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].subtotal = 
      this.items[existingItemIndex].unitPrice * this.items[existingItemIndex].quantity;
  } else {
    // Add new item
    this.items.push({
      productId: productData._id,
      productName: productData.name,
      productSlug: productData.slug,
      productImage: productData.images && productData.images[0] ? productData.images[0] : null,
      unitPrice: productData.price,
      quantity: quantity,
      subtotal: productData.price * quantity
    });
  }

  return this;
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      this.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      this.items[itemIndex].quantity = quantity;
      this.items[itemIndex].subtotal = this.items[itemIndex].unitPrice * quantity;
    }
  }

  return this;
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  return this;
};

// Instance method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this;
};

// Instance method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    itemCount: this.items.length,
    lastModified: this.lastModified
  };
};

// Static method to find cart by user ID
cartSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to find cart by session ID
cartSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId });
};

// Static method to merge guest cart into user cart
cartSchema.statics.mergeGuestCart = async function(userId, sessionId) {
  const userCart = await this.findByUserId(userId);
  const guestCart = await this.findBySessionId(sessionId);

  if (!guestCart || guestCart.items.length === 0) {
    return userCart;
  }

  if (!userCart) {
    // Transfer guest cart to user
    guestCart.userId = userId;
    guestCart.sessionId = undefined;
    await guestCart.save();
    return guestCart;
  }

  // Merge items from guest cart into user cart
  for (const guestItem of guestCart.items) {
    const existingItemIndex = userCart.items.findIndex(
      item => item.productId.toString() === guestItem.productId.toString()
    );

    if (existingItemIndex > -1) {
      // Add quantities together
      userCart.items[existingItemIndex].quantity += guestItem.quantity;
      userCart.items[existingItemIndex].subtotal = 
        userCart.items[existingItemIndex].unitPrice * userCart.items[existingItemIndex].quantity;
    } else {
      // Add guest item to user cart
      userCart.items.push(guestItem);
    }
  }

  // Save user cart and delete guest cart
  await userCart.save();
  await this.deleteOne({ _id: guestCart._id });

  return userCart;
};

// Static method to clean up old guest carts (for maintenance)
cartSchema.statics.cleanupOldGuestCarts = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    sessionId: { $exists: true },
    userId: { $exists: false },
    updatedAt: { $lt: cutoffDate }
  });
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;