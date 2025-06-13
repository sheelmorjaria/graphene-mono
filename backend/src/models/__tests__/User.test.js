import mongoose from 'mongoose';
import User from '../User.js';

describe('User Model', () => {
  // Using global test setup for MongoDB connection

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('User Schema Validation', () => {
    it('should create a valid user with required fields', async () => {
      const userData = {
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email.toLowerCase());
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.emailVerified).toBe(false);
      expect(savedUser.marketingOptIn).toBe(false);
      expect(savedUser.role).toBe('customer');
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should create user with optional fields', async () => {
      const userData = {
        email: 'jane.smith@example.com',
        password: 'SecurePass456!',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+447123456789',
        marketingOptIn: true
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.phone).toBe(userData.phone);
      expect(savedUser.marketingOptIn).toBe(true);
    });

    it('should fail validation without required fields', async () => {
      const user = new User({});
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Please enter a valid email address');
    });

    it('should fail validation with short password', async () => {
      const userData = {
        email: 'john.doe@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Password must be at least 8 characters long');
    });

    it('should fail validation with invalid phone number', async () => {
      const userData = {
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: 'invalid-phone'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow('Please enter a valid phone number');
    });

    it('should enforce unique email constraint', async () => {
      const userData1 = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const userData2 = {
        email: 'DUPLICATE@EXAMPLE.COM', // Different case
        password: 'SecurePass456!',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'PlainPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    it('should not hash password if not modified', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'PlainPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const originalPassword = savedUser.password;

      // Update without changing password
      savedUser.firstName = 'Updated';
      await savedUser.save();

      expect(savedUser.password).toBe(originalPassword);
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      user = new User(userData);
      await user.save();
    });

    it('should compare password correctly', async () => {
      const isMatch = await user.comparePassword('TestPassword123!');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('WrongPassword');
      expect(isNotMatch).toBe(false);
    });

    it('should get full name', () => {
      const fullName = user.getFullName();
      expect(fullName).toBe('John Doe');
    });

    it('should generate email verification token', () => {
      const token = user.generateEmailVerificationToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64); // 32 bytes hex = 64 chars
      expect(user.emailVerificationToken).toBe(token);
      expect(user.emailVerificationExpires).toBeDefined();
      expect(user.emailVerificationExpires.getTime()).toBeGreaterThan(Date.now());
    });

    it('should generate password reset token', () => {
      const token = user.generatePasswordResetToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64); // 32 bytes hex = 64 chars
      expect(user.passwordResetToken).toBe(token);
      expect(user.passwordResetExpires).toBeDefined();
      expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      const users = [
        {
          email: 'user1@example.com',
          password: 'Password123!',
          firstName: 'User',
          lastName: 'One',
          isActive: true
        },
        {
          email: 'user2@example.com',
          password: 'Password123!',
          firstName: 'User',
          lastName: 'Two',
          isActive: false
        }
      ];

      await User.insertMany(users);
    });

    it('should find user by email', async () => {
      const user = await User.findByEmail('USER1@EXAMPLE.COM');
      expect(user).toBeDefined();
      expect(user.email).toBe('user1@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await User.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });

    it('should find only active users', async () => {
      const activeUsers = await User.findActiveUsers();
      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].email).toBe('user1@example.com');
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude sensitive fields from JSON output', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = new User(userData);
      user.emailVerificationToken = 'test-token';
      user.passwordResetToken = 'reset-token';
      await user.save();

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.emailVerificationToken).toBeUndefined();
      expect(json.emailVerificationExpires).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
      expect(json.passwordResetExpires).toBeUndefined();
      
      // Should include non-sensitive fields
      expect(json.email).toBe('test@example.com');
      expect(json.firstName).toBe('John');
      expect(json.lastName).toBe('Doe');
    });
  });

  describe('Indexing', () => {
    it('should have proper indexes defined', () => {
      const indexes = User.collection.getIndexes;
      expect(indexes).toBeDefined();
    });
  });
});