import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import AccountDeletionRequest from '../AccountDeletionRequest.js';

describe('AccountDeletionRequest Model', () => {
  let testUserId;

  beforeEach(async () => {
    await AccountDeletionRequest.deleteMany({});
    testUserId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    await AccountDeletionRequest.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid account deletion request', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe',
        status: 'pending',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      });

      const savedRequest = await deletionRequest.save();
      expect(savedRequest._id).toBeDefined();
      expect(savedRequest.userId.toString()).toBe(testUserId.toString());
      expect(savedRequest.requestId).toBe('deletion_test_123');
      expect(savedRequest.userEmail).toBe('test@example.com');
      expect(savedRequest.userName).toBe('John Doe');
      expect(savedRequest.status).toBe('pending');
      expect(savedRequest.requestedAt).toBeInstanceOf(Date);
    });

    it('should require userId', async () => {
      const deletionRequest = new AccountDeletionRequest({
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe'
      });

      await expect(deletionRequest.save()).rejects.toThrow(/userId.*required/);
    });

    it('should require requestId', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        userEmail: 'test@example.com',
        userName: 'John Doe'
      });

      await expect(deletionRequest.save()).rejects.toThrow(/requestId.*required/);
    });

    it('should require userEmail', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userName: 'John Doe'
      });

      await expect(deletionRequest.save()).rejects.toThrow(/userEmail.*required/);
    });

    it('should require userName', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com'
      });

      await expect(deletionRequest.save()).rejects.toThrow(/userName.*required/);
    });

    it('should enforce unique requestId', async () => {
      // Create first request
      const firstRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_duplicate_test',
        userEmail: 'test1@example.com',
        userName: 'John Doe'
      });
      await firstRequest.save();

      // Try to create second request with same requestId
      const secondRequest = new AccountDeletionRequest({
        userId: new mongoose.Types.ObjectId(),
        requestId: 'deletion_duplicate_test',
        userEmail: 'test2@example.com',
        userName: 'Jane Doe'
      });

      await expect(secondRequest.save()).rejects.toThrow(/duplicate key/);
    });

    it('should only allow valid status values', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe',
        status: 'invalid_status'
      });

      await expect(deletionRequest.save()).rejects.toThrow(/not a valid enum value/);
    });

    it('should only allow valid deletionType values', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe',
        deletionType: 'invalid_type'
      });

      await expect(deletionRequest.save()).rejects.toThrow(/not a valid enum value/);
    });

    it('should default deletionType to soft', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe'
      });

      const savedRequest = await deletionRequest.save();
      expect(savedRequest.deletionType).toBe('soft');
    });

    it('should default passwordVerified to false', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe'
      });

      const savedRequest = await deletionRequest.save();
      expect(savedRequest.passwordVerified).toBe(false);
    });

    it('should set default data retention policies', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe'
      });

      const savedRequest = await deletionRequest.save();
      expect(savedRequest.dataRetained.orders).toBe(true);
      expect(savedRequest.dataRetained.transactions).toBe(true);
      expect(savedRequest.dataRetained.supportTickets).toBe(false);
    });
  });

  describe('Pre-save Middleware', () => {
    it('should enforce data retention policies on save', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe',
        dataRetained: {
          orders: false, // Try to set to false
          transactions: false, // Try to set to false
          supportTickets: true
        }
      });

      const savedRequest = await deletionRequest.save();
      
      // Orders and transactions should be forced to true
      expect(savedRequest.dataRetained.orders).toBe(true);
      expect(savedRequest.dataRetained.transactions).toBe(true);
      expect(savedRequest.dataRetained.supportTickets).toBe(true);
    });

    it('should only enforce data retention on modified dataRetained field', async () => {
      const deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_123',
        userEmail: 'test@example.com',
        userName: 'John Doe'
      });

      await deletionRequest.save();

      // Update just the status (not dataRetained)
      deletionRequest.status = 'processing';
      await deletionRequest.save();

      // Data retention should remain unchanged
      expect(deletionRequest.dataRetained.orders).toBe(true);
      expect(deletionRequest.dataRetained.transactions).toBe(true);
    });
  });

  describe('Static Methods', () => {
    describe('createRequest', () => {
      it('should create a request with generated requestId', () => {
        const userId = new mongoose.Types.ObjectId();
        const userEmail = 'test@example.com';
        const userName = 'John Doe';
        const ipAddress = '192.168.1.1';
        const userAgent = 'Mozilla/5.0 Test Browser';

        const request = AccountDeletionRequest.createRequest(userId, userEmail, userName, ipAddress, userAgent);

        expect(request.userId).toBe(userId);
        expect(request.userEmail).toBe(userEmail);
        expect(request.userName).toBe(userName);
        expect(request.ipAddress).toBe(ipAddress);
        expect(request.userAgent).toBe(userAgent);
        expect(request.requestId).toMatch(/^deletion_.*$/);
        expect(request.status).toBe('pending');
        expect(request.passwordVerified).toBe(true);
      });

      it('should generate unique requestIds', () => {
        const userId1 = new mongoose.Types.ObjectId();
        const userId2 = new mongoose.Types.ObjectId();
        
        const request1 = AccountDeletionRequest.createRequest(userId1, 'test1@example.com', 'John Doe', '192.168.1.1', 'Browser1');
        const request2 = AccountDeletionRequest.createRequest(userId2, 'test2@example.com', 'Jane Doe', '192.168.1.2', 'Browser2');

        expect(request1.requestId).not.toBe(request2.requestId);
      });
    });

    describe('findPendingRequests', async () => {
      beforeEach(async () => {
        // Create test requests with different statuses and timestamps
        await AccountDeletionRequest.create([
          {
            userId: new mongoose.Types.ObjectId(),
            requestId: 'deletion_pending_1',
            userEmail: 'test1@example.com',
            userName: 'User 1',
            status: 'pending',
            requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            userId: new mongoose.Types.ObjectId(),
            requestId: 'deletion_pending_2',
            userEmail: 'test2@example.com',
            userName: 'User 2',
            status: 'pending',
            requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
          },
          {
            userId: new mongoose.Types.ObjectId(),
            requestId: 'deletion_processing',
            userEmail: 'test3@example.com',
            userName: 'User 3',
            status: 'processing'
          },
          {
            userId: new mongoose.Types.ObjectId(),
            requestId: 'deletion_completed',
            userEmail: 'test4@example.com',
            userName: 'User 4',
            status: 'completed'
          }
        ]);
      });

      it('should find only pending requests ordered by oldest first', async () => {
        const pendingRequests = await AccountDeletionRequest.findPendingRequests();

        expect(pendingRequests).toHaveLength(2);
        expect(pendingRequests[0].requestId).toBe('deletion_pending_1'); // Oldest first
        expect(pendingRequests[1].requestId).toBe('deletion_pending_2');
        
        // Verify all are pending
        pendingRequests.forEach(request => {
          expect(request.status).toBe('pending');
        });
      });

      it('should return empty array when no pending requests exist', async () => {
        await AccountDeletionRequest.deleteMany({ status: 'pending' });
        
        const pendingRequests = await AccountDeletionRequest.findPendingRequests();
        expect(pendingRequests).toHaveLength(0);
      });
    });

    describe('findByUserId', async () => {
      beforeEach(async () => {
        await AccountDeletionRequest.create([
          {
            userId: testUserId,
            requestId: 'deletion_user_1',
            userEmail: 'test@example.com',
            userName: 'Test User',
            status: 'completed',
            requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            userId: testUserId,
            requestId: 'deletion_user_2',
            userEmail: 'test@example.com',
            userName: 'Test User',
            status: 'pending',
            requestedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
          },
          {
            userId: new mongoose.Types.ObjectId(),
            requestId: 'deletion_other_user',
            userEmail: 'other@example.com',
            userName: 'Other User',
            status: 'pending'
          }
        ]);
      });

      it('should find all requests for specific user ordered by newest first', async () => {
        const userRequests = await AccountDeletionRequest.findByUserId(testUserId);

        expect(userRequests).toHaveLength(2);
        expect(userRequests[0].requestId).toBe('deletion_user_2'); // Newest first
        expect(userRequests[1].requestId).toBe('deletion_user_1');
        
        // Verify all belong to the user
        userRequests.forEach(request => {
          expect(request.userId.toString()).toBe(testUserId.toString());
        });
      });

      it('should return empty array for user with no requests', async () => {
        const otherUserId = new mongoose.Types.ObjectId();
        const userRequests = await AccountDeletionRequest.findByUserId(otherUserId);
        
        expect(userRequests).toHaveLength(0);
      });
    });
  });

  describe('Instance Methods', () => {
    let deletionRequest;

    beforeEach(async () => {
      deletionRequest = new AccountDeletionRequest({
        userId: testUserId,
        requestId: 'deletion_test_methods',
        userEmail: 'test@example.com',
        userName: 'Test User',
        status: 'pending'
      });
      await deletionRequest.save();
    });

    describe('markAsProcessing', () => {
      it('should update status to processing and set processedAt', async () => {
        const beforeTime = new Date();
        await deletionRequest.markAsProcessing();
        const afterTime = new Date();

        expect(deletionRequest.status).toBe('processing');
        expect(deletionRequest.processedAt).toBeInstanceOf(Date);
        expect(deletionRequest.processedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(deletionRequest.processedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());

        // Verify it was saved to database
        const savedRequest = await AccountDeletionRequest.findById(deletionRequest._id);
        expect(savedRequest.status).toBe('processing');
        expect(savedRequest.processedAt).toBeInstanceOf(Date);
      });
    });

    describe('markAsCompleted', () => {
      it('should update status to completed with processing metadata', async () => {
        const processingMetadata = {
          ordersAnonymized: 5,
          recordsDeleted: 10,
          processingTimeMs: 15000,
          dataRetentionPolicyVersion: '1.0'
        };

        await deletionRequest.markAsCompleted(processingMetadata);

        expect(deletionRequest.status).toBe('completed');
        expect(deletionRequest.completedAt).toBeInstanceOf(Date);
        expect(deletionRequest.processingMetadata).toEqual(processingMetadata);

        // Verify it was saved to database
        const savedRequest = await AccountDeletionRequest.findById(deletionRequest._id);
        expect(savedRequest.status).toBe('completed');
        expect(savedRequest.processingMetadata.ordersAnonymized).toBe(5);
      });

      it('should work without processing metadata', async () => {
        await deletionRequest.markAsCompleted();

        expect(deletionRequest.status).toBe('completed');
        expect(deletionRequest.completedAt).toBeInstanceOf(Date);

        // Verify it was saved to database
        const savedRequest = await AccountDeletionRequest.findById(deletionRequest._id);
        expect(savedRequest.status).toBe('completed');
      });

      it('should merge with existing processing metadata', async () => {
        // Set initial metadata (using schema-allowed keys only)
        deletionRequest.processingMetadata = { recordsDeleted: 7 };
        await deletionRequest.save();

        // Mark as completed with additional metadata
        await deletionRequest.markAsCompleted({ ordersAnonymized: 3 });

        expect(deletionRequest.processingMetadata).toEqual({
          recordsDeleted: 7,
          ordersAnonymized: 3
        });
      });
    });

    describe('markAsFailed', () => {
      it('should update status to failed with error message', async () => {
        const errorMessage = 'User account not found';

        await deletionRequest.markAsFailed(errorMessage);

        expect(deletionRequest.status).toBe('failed');
        expect(deletionRequest.errorMessage).toBe(errorMessage);

        // Verify it was saved to database
        const savedRequest = await AccountDeletionRequest.findById(deletionRequest._id);
        expect(savedRequest.status).toBe('failed');
        expect(savedRequest.errorMessage).toBe(errorMessage);
      });
    });

    describe('cancel', () => {
      it('should update status to cancelled with admin notes', async () => {
        const reason = 'Request cancelled by user';

        await deletionRequest.cancel(reason);

        expect(deletionRequest.status).toBe('cancelled');
        expect(deletionRequest.adminNotes).toBe(reason);

        // Verify it was saved to database
        const savedRequest = await AccountDeletionRequest.findById(deletionRequest._id);
        expect(savedRequest.status).toBe('cancelled');
        expect(savedRequest.adminNotes).toBe(reason);
      });
    });
  });

  describe('Indexes', () => {
    it('should have proper indexes defined', async () => {
      const indexes = await AccountDeletionRequest.collection.getIndexes();
      
      // Check for required indexes
      expect(indexes).toHaveProperty('userId_1');
      expect(indexes).toHaveProperty('requestId_1');
      expect(indexes).toHaveProperty('status_1');
      expect(indexes).toHaveProperty('requestedAt_1');
      expect(indexes).toHaveProperty('requestedAt_-1');
      expect(indexes).toHaveProperty('status_1_requestedAt_-1');
    });
  });
});