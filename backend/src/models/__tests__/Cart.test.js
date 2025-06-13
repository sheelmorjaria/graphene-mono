import mongoose from 'mongoose';
import Cart from '../Cart.js';
import Product from '../Product.js';

describe('Cart Model', () => {
  // Using global test setup for MongoDB connection

  afterEach(async () => {
    await Cart.deleteMany({});
  });

  const mockProduct = {
    _id: new mongoose.Types.ObjectId(),
    name: 'GrapheneOS Pixel 9 Pro',
    slug: 'grapheneos-pixel-9-pro',
    price: 999.99,
    images: ['https://example.com/image1.jpg'],
    stockQuantity: 10
  };

  describe('Schema Validation', () => {
    it('should create a valid empty cart for authenticated user', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({ userId });
      const savedCart = await cart.save();

      expect(savedCart._id).toBeDefined();
      expect(savedCart.userId).toEqual(userId);
      expect(savedCart.sessionId).toBeUndefined();
      expect(savedCart.items).toEqual([]);
      expect(savedCart.totalItems).toBe(0);
      expect(savedCart.totalAmount).toBe(0);
      expect(savedCart.lastModified).toBeDefined();
    });

    it('should create a valid empty cart for guest user', async () => {
      const sessionId = 'guest-session-123';
      const cart = new Cart({ sessionId });
      const savedCart = await cart.save();

      expect(savedCart._id).toBeDefined();
      expect(savedCart.userId).toBeUndefined();
      expect(savedCart.sessionId).toBe(sessionId);
      expect(savedCart.items).toEqual([]);
      expect(savedCart.totalItems).toBe(0);
      expect(savedCart.totalAmount).toBe(0);
    });

    it('should validate cart item schema', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        userId,
        items: [{
          productId: mockProduct._id,
          productName: mockProduct.name,
          productSlug: mockProduct.slug,
          productImage: mockProduct.images[0],
          unitPrice: mockProduct.price,
          quantity: 2,
          subtotal: mockProduct.price * 2
        }]
      });

      const savedCart = await cart.save();
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.items[0].productName).toBe(mockProduct.name);
      expect(savedCart.items[0].quantity).toBe(2);
      expect(savedCart.totalItems).toBe(2);
      expect(savedCart.totalAmount).toBe(mockProduct.price * 2);
    });

    it('should require productId for cart items', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        userId,
        items: [{
          productName: 'Test Product',
          productSlug: 'test-product',
          unitPrice: 100,
          quantity: 1,
          subtotal: 100
        }]
      });

      await expect(cart.save()).rejects.toThrow('Product ID is required');
    });

    it('should validate quantity limits', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        userId,
        items: [{
          productId: mockProduct._id,
          productName: mockProduct.name,
          productSlug: mockProduct.slug,
          unitPrice: mockProduct.price,
          quantity: 150, // Exceeds max of 99
          subtotal: mockProduct.price * 150
        }]
      });

      await expect(cart.save()).rejects.toThrow('Quantity cannot exceed 99');
    });

    it('should validate cart size limit', async () => {
      const userId = new mongoose.Types.ObjectId();
      const items = [];
      
      // Create 51 items (exceeds limit of 50)
      for (let i = 0; i < 51; i++) {
        items.push({
          productId: new mongoose.Types.ObjectId(),
          productName: `Product ${i}`,
          productSlug: `product-${i}`,
          unitPrice: 10,
          quantity: 1,
          subtotal: 10
        });
      }

      const cart = new Cart({ userId, items });
      await expect(cart.save()).rejects.toThrow('Cart cannot contain more than 50 different items');
    });
  });

  describe('Pre-save Middleware', () => {
    it('should calculate totals automatically', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({
        userId,
        items: [
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'Product 1',
            productSlug: 'product-1',
            unitPrice: 100,
            quantity: 2,
            subtotal: 200
          },
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'Product 2',
            productSlug: 'product-2',
            unitPrice: 50,
            quantity: 3,
            subtotal: 150
          }
        ]
      });

      const savedCart = await cart.save();
      expect(savedCart.totalItems).toBe(5); // 2 + 3
      expect(savedCart.totalAmount).toBe(350); // 200 + 150
      expect(savedCart.lastModified).toBeDefined();
    });

    it('should update lastModified on save', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({ userId });
      const savedCart = await cart.save();
      
      const originalLastModified = savedCart.lastModified;
      
      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      savedCart.items.push({
        productId: mockProduct._id,
        productName: mockProduct.name,
        productSlug: mockProduct.slug,
        unitPrice: mockProduct.price,
        quantity: 1,
        subtotal: mockProduct.price
      });
      
      const updatedCart = await savedCart.save();
      expect(updatedCart.lastModified).not.toEqual(originalLastModified);
    });
  });

  describe('Instance Methods', () => {
    let cart;

    beforeEach(async () => {
      const userId = new mongoose.Types.ObjectId();
      cart = new Cart({ userId });
      await cart.save();
    });

    it('should add new item to empty cart', () => {
      cart.addItem(mockProduct, 2);
      
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toEqual(mockProduct._id);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].subtotal).toBe(mockProduct.price * 2);
    });

    it('should increment quantity for existing item', () => {
      // Add item first time
      cart.addItem(mockProduct, 1);
      expect(cart.items[0].quantity).toBe(1);
      
      // Add same item again
      cart.addItem(mockProduct, 2);
      expect(cart.items).toHaveLength(1); // Still only one unique item
      expect(cart.items[0].quantity).toBe(3); // 1 + 2
      expect(cart.items[0].subtotal).toBe(mockProduct.price * 3);
    });

    it('should update item quantity', () => {
      cart.addItem(mockProduct, 5);
      cart.updateItemQuantity(mockProduct._id, 3);
      
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.items[0].subtotal).toBe(mockProduct.price * 3);
    });

    it('should remove item when quantity is set to 0', () => {
      cart.addItem(mockProduct, 2);
      expect(cart.items).toHaveLength(1);
      
      cart.updateItemQuantity(mockProduct._id, 0);
      expect(cart.items).toHaveLength(0);
    });

    it('should remove item completely', () => {
      cart.addItem(mockProduct, 2);
      expect(cart.items).toHaveLength(1);
      
      cart.removeItem(mockProduct._id);
      expect(cart.items).toHaveLength(0);
    });

    it('should clear all items', () => {
      cart.addItem(mockProduct, 1);
      cart.addItem({ ...mockProduct, _id: new mongoose.Types.ObjectId() }, 2);
      expect(cart.items).toHaveLength(2);
      
      cart.clearCart();
      expect(cart.items).toHaveLength(0);
    });

    it('should get cart summary', async () => {
      cart.addItem(mockProduct, 2);
      cart.addItem({ ...mockProduct, _id: new mongoose.Types.ObjectId() }, 1);
      await cart.save(); // Save to trigger pre-save middleware
      
      const summary = cart.getSummary();
      expect(summary.totalItems).toBe(3);
      expect(summary.totalAmount).toBe(mockProduct.price * 3);
      expect(summary.itemCount).toBe(2);
      expect(summary.lastModified).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('should find cart by user ID', async () => {
      const userId = new mongoose.Types.ObjectId();
      const cart = new Cart({ userId });
      await cart.save();

      const foundCart = await Cart.findByUserId(userId);
      expect(foundCart).toBeTruthy();
      expect(foundCart.userId).toEqual(userId);
    });

    it('should find cart by session ID', async () => {
      const sessionId = 'test-session-123';
      const cart = new Cart({ sessionId });
      await cart.save();

      const foundCart = await Cart.findBySessionId(sessionId);
      expect(foundCart).toBeTruthy();
      expect(foundCart.sessionId).toBe(sessionId);
    });

    it('should merge guest cart into user cart', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'guest-session-456';

      // Create user cart with one item
      const userCart = new Cart({ userId });
      userCart.addItem(mockProduct, 1);
      await userCart.save();

      // Create guest cart with different item
      const guestProduct = { ...mockProduct, _id: new mongoose.Types.ObjectId() };
      const guestCart = new Cart({ sessionId });
      guestCart.addItem(guestProduct, 2);
      await guestCart.save();

      // Merge carts
      const mergedCart = await Cart.mergeGuestCart(userId, sessionId);
      
      expect(mergedCart.userId).toEqual(userId);
      expect(mergedCart.items).toHaveLength(2);
      expect(mergedCart.totalItems).toBe(3); // 1 + 2
      
      // Guest cart should be deleted
      const deletedGuestCart = await Cart.findBySessionId(sessionId);
      expect(deletedGuestCart).toBeNull();
    });

    it('should merge guest cart with same products', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'guest-session-789';

      // Create user cart with product
      const userCart = new Cart({ userId });
      userCart.addItem(mockProduct, 2);
      await userCart.save();

      // Create guest cart with same product
      const guestCart = new Cart({ sessionId });
      guestCart.addItem(mockProduct, 3);
      await guestCart.save();

      // Merge carts
      const mergedCart = await Cart.mergeGuestCart(userId, sessionId);
      
      expect(mergedCart.items).toHaveLength(1);
      expect(mergedCart.items[0].quantity).toBe(5); // 2 + 3
      expect(mergedCart.totalItems).toBe(5);
    });

    it('should transfer guest cart when user has no cart', async () => {
      const userId = new mongoose.Types.ObjectId();
      const sessionId = 'guest-session-transfer';

      // Create guest cart
      const guestCart = new Cart({ sessionId });
      guestCart.addItem(mockProduct, 1);
      await guestCart.save();

      // Merge into non-existing user cart
      const mergedCart = await Cart.mergeGuestCart(userId, sessionId);
      
      expect(mergedCart.userId).toEqual(userId);
      expect(mergedCart.sessionId).toBeUndefined();
      expect(mergedCart.items).toHaveLength(1);
    });
  });

  describe('Indexes', () => {
    it('should have index on userId', async () => {
      const indexes = await Cart.collection.getIndexes();
      const userIdIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'userId')
      );
      expect(userIdIndex).toBeDefined();
    });

    it('should have index on sessionId', async () => {
      const indexes = await Cart.collection.getIndexes();
      const sessionIdIndex = Object.keys(indexes).find(key => 
        indexes[key].some(field => field[0] === 'sessionId')
      );
      expect(sessionIdIndex).toBeDefined();
    });
  });
});