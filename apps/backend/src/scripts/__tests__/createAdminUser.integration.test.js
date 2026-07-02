import { vi } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { connectTestDatabase, disconnectTestDatabase, clearTestDatabase } from '../../test/setup.js';

// Mock console methods to suppress output during tests
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation();
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation();

// Mock process.exit to prevent tests from exiting
const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit was called');
});

// Import the script function (assuming it exports a function)
import { createAdminUser } from '../createAdminUser.js';

describe('Create Admin User Script', () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  beforeEach(async () => {
    // `clearAllMocks()` (called below) resets spy mock implementations, so the
    // mongoose.connect stub must be (re)installed here each test. The script
    // calls `mongoose.connect(process.env.MONGODB_URI)`; under the integration
    // harness the shared replica-set connection is already open and
    // MONGODB_URI is unset, so a real connect() would throw. Short-circuit to
    // the existing connection in that case (the harness owns it), while still
    // letting a genuine new URI through.
    await clearTestDatabase();
    vi.clearAllMocks();
    // (Re)install AFTER clearAllMocks, which otherwise resets the implementation.
    const originalConnect = mongoose.connect.bind(mongoose);
    vi.spyOn(mongoose, 'connect').mockImplementation(async (uri) => {
      if (mongoose.connection.readyState === 1 || !uri) {
        return mongoose.connection;
      }
      return originalConnect(uri);
    });
  });

  it('should create an admin user successfully', async () => {
    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true
    };

    await createAdminUser(adminData);

    const createdUser = await User.findOne({ email: adminData.email });
    expect(createdUser).toBeTruthy();
    expect(createdUser.role).toBe('admin');
    expect(createdUser.firstName).toBe(adminData.firstName);
    expect(createdUser.lastName).toBe(adminData.lastName);
    expect(createdUser.isActive).toBe(true);

    // Verify password is hashed
    const isPasswordValid = await bcrypt.compare(adminData.password, createdUser.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should not create duplicate admin user', async () => {
    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User'
    };

    // Create admin user first time
    await createAdminUser(adminData);

    // Try to create again
    await createAdminUser(adminData);

    // Should only have one admin user
    const adminUsers = await User.find({ email: adminData.email });
    expect(adminUsers).toHaveLength(1);
  });

  it('should handle missing required fields', async () => {
    const incompleteData = {
      email: 'admin@test.com'
      // Missing password, firstName, lastName
    };

    await expect(createAdminUser(incompleteData)).rejects.toThrow();
  });

  it('should handle invalid email format', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User'
    };

    await expect(createAdminUser(invalidData)).rejects.toThrow();
  });

  it('should handle weak passwords', async () => {
    const weakPasswordData = {
      email: 'admin@test.com',
      password: '123',
      firstName: 'Admin',
      lastName: 'User'
    };

    await expect(createAdminUser(weakPasswordData)).rejects.toThrow();
  });

  it('should handle database connection errors', async () => {
    // Under the shared-connection integration harness we cannot tear down the
    // real connection (it would break every later test in this process).
    // Instead, simulate a database failure by stubbing User.findOne to throw,
    // which forces the script's try/catch -> process.exit(1) path.
    const originalFindOne = User.findOne;
    User.findOne = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User'
    };

    await expect(createAdminUser(adminData)).rejects.toThrow();

    // Restore the real model method for subsequent tests
    User.findOne = originalFindOne;
  });

  it('should create admin with default role permissions', async () => {
    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };

    await createAdminUser(adminData);

    const createdUser = await User.findOne({ email: adminData.email });
    expect(createdUser.role).toBe('admin');
    expect(createdUser.isActive).toBe(true);
  });

  it('should set correct metadata fields', async () => {
    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true
    };

    await createAdminUser(adminData);

    const createdUser = await User.findOne({ email: adminData.email });
    expect(createdUser.emailVerified).toBe(true);
    expect(createdUser.createdAt).toBeTruthy();
    expect(createdUser.updatedAt).toBeTruthy();
    expect(createdUser.lastLoginAt).toBeUndefined();
  });

  it('should handle special characters in names', async () => {
    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Adán',
      lastName: 'O\'Connor-Smith'
    };

    await createAdminUser(adminData);

    const createdUser = await User.findOne({ email: adminData.email });
    expect(createdUser.firstName).toBe('Adán');
    expect(createdUser.lastName).toBe('O\'Connor-Smith');
  });

  it('should normalize email to lowercase', async () => {
    const adminData = {
      email: 'ADMIN@TEST.COM',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User'
    };

    await createAdminUser(adminData);

    const createdUser = await User.findOne({ email: 'admin@test.com' });
    expect(createdUser).toBeTruthy();
    expect(createdUser.email).toBe('admin@test.com');
  });

  it('should create user with proper security settings', async () => {
    const adminData = {
      email: 'admin@test.com',
      password: 'adminPassword123',
      firstName: 'Admin',
      lastName: 'User'
    };

    await createAdminUser(adminData);

    const createdUser = await User.findOne({ email: adminData.email });

    // Password should be hashed with sufficient rounds
    expect(createdUser.password).not.toBe(adminData.password);
    expect(createdUser.password.startsWith('$2')).toBe(true); // bcrypt hash

    // Sensitive security fields should not be populated for a brand-new admin
    expect(createdUser.passwordResetToken).toBeUndefined();
    expect(createdUser.emailVerificationToken).toBeUndefined();
  });
});