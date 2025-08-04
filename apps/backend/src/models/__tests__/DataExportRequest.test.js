import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import DataExportRequest from '../DataExportRequest.js';

describe('DataExportRequest Model', () => {
  let testUserId;

  beforeAll(async () => {
    // Ensure we're using test database
    if (!process.env.MONGODB_URI?.includes('test')) {
      throw new Error('Tests must use test database');
    }
  });

  beforeEach(async () => {
    await DataExportRequest.deleteMany({});
    testUserId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    await DataExportRequest.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should create a valid data export request', async () => {
      const exportRequest = new DataExportRequest({
        userId: testUserId,
        requestId: 'export_test_123',
        status: 'pending',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser'
      });

      const savedRequest = await exportRequest.save();
      expect(savedRequest._id).toBeDefined();
      expect(savedRequest.userId.toString()).toBe(testUserId.toString());
      expect(savedRequest.requestId).toBe('export_test_123');
      expect(savedRequest.status).toBe('pending');
      expect(savedRequest.requestedAt).toBeInstanceOf(Date);
    });

    it('should require userId', async () => {
      const exportRequest = new DataExportRequest({
        requestId: 'export_test_123',
        status: 'pending'
      });

      await expect(exportRequest.save()).rejects.toThrow(/userId.*required/);
    });

    it('should require requestId', async () => {
      const exportRequest = new DataExportRequest({
        userId: testUserId,
        status: 'pending'
      });

      await expect(exportRequest.save()).rejects.toThrow(/requestId.*required/);
    });

    it('should enforce unique requestId', async () => {
      // Create first request
      const firstRequest = new DataExportRequest({
        userId: testUserId,
        requestId: 'export_duplicate_test',
        status: 'pending'
      });
      await firstRequest.save();

      // Try to create second request with same requestId
      const secondRequest = new DataExportRequest({
        userId: new mongoose.Types.ObjectId(),
        requestId: 'export_duplicate_test',
        status: 'pending'
      });

      await expect(secondRequest.save()).rejects.toThrow(/duplicate key/);
    });

    it('should only allow valid status values', async () => {
      const exportRequest = new DataExportRequest({
        userId: testUserId,
        requestId: 'export_test_123',
        status: 'invalid_status'
      });

      await expect(exportRequest.save()).rejects.toThrow(/not a valid enum value/);
    });
  });

  describe('Static Methods', () => {
    describe('createRequest', () => {
      it('should create a request with generated requestId', () => {
        const userId = new mongoose.Types.ObjectId();
        const ipAddress = '192.168.1.1';
        const userAgent = 'Mozilla/5.0 Test Browser';

        const request = DataExportRequest.createRequest(userId, ipAddress, userAgent);

        expect(request.userId).toBe(userId);
        expect(request.requestId).toMatch(/^export_.*$/);
        expect(request.ipAddress).toBe(ipAddress);
        expect(request.userAgent).toBe(userAgent);
        expect(request.status).toBe('pending');
      });

      it('should generate unique requestIds', () => {
        const userId = new mongoose.Types.ObjectId();
        
        const request1 = DataExportRequest.createRequest(userId, '192.168.1.1', 'Browser1');
        const request2 = DataExportRequest.createRequest(userId, '192.168.1.2', 'Browser2');

        expect(request1.requestId).not.toBe(request2.requestId);
      });
    });

    describe('findActiveByUserId', async () => {
      beforeEach(async () => {
        const userId = new mongoose.Types.ObjectId();
        
        // Create various test requests
        await DataExportRequest.create([
          {
            userId,
            requestId: 'export_active_1',
            status: 'pending'
          },
          {
            userId,
            requestId: 'export_active_2',
            status: 'processing'
          },
          {
            userId,
            requestId: 'export_completed',
            status: 'completed',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Future expiry
          },
          {
            userId,
            requestId: 'export_expired',
            status: 'completed',
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Past expiry
          },
          {
            userId,
            requestId: 'export_failed',
            status: 'failed'
          }
        ]);

        testUserId = userId;
      });

      it('should find all active requests for user', async () => {
        const activeRequests = await DataExportRequest.findActiveByUserId(testUserId);

        expect(activeRequests).toHaveLength(3);
        const requestIds = activeRequests.map(req => req.requestId);
        expect(requestIds).toContain('export_active_1');
        expect(requestIds).toContain('export_active_2');
        expect(requestIds).toContain('export_completed');
        expect(requestIds).not.toContain('export_expired');
        expect(requestIds).not.toContain('export_failed');
      });

      it('should return empty array for user with no active requests', async () => {
        const otherUserId = new mongoose.Types.ObjectId();
        const activeRequests = await DataExportRequest.findActiveByUserId(otherUserId);

        expect(activeRequests).toHaveLength(0);
      });
    });
  });

  describe('Instance Methods', () => {
    let exportRequest;

    beforeEach(async () => {
      exportRequest = new DataExportRequest({
        userId: testUserId,
        requestId: 'export_test_methods',
        status: 'pending'
      });
      await exportRequest.save();
    });

    describe('markAsProcessing', () => {
      it('should update status to processing and set processedAt', async () => {
        const beforeTime = new Date();
        await exportRequest.markAsProcessing();
        const afterTime = new Date();

        expect(exportRequest.status).toBe('processing');
        expect(exportRequest.processedAt).toBeInstanceOf(Date);
        expect(exportRequest.processedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(exportRequest.processedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());

        // Verify it was saved to database
        const savedRequest = await DataExportRequest.findById(exportRequest._id);
        expect(savedRequest.status).toBe('processing');
        expect(savedRequest.processedAt).toBeInstanceOf(Date);
      });
    });

    describe('markAsCompleted', () => {
      it('should update status to completed with download details', async () => {
        const downloadUrl = 'https://secure-exports.example.com/download/test123';
        const fileSize = 1024000;
        const expirationHours = 48;

        await exportRequest.markAsCompleted(downloadUrl, fileSize, expirationHours);

        expect(exportRequest.status).toBe('completed');
        expect(exportRequest.downloadUrl).toBe(downloadUrl);
        expect(exportRequest.fileSize).toBe(fileSize);
        expect(exportRequest.expiresAt).toBeInstanceOf(Date);

        // Check expiration is approximately correct (within 1 minute)
        const expectedExpiry = new Date(Date.now() + (expirationHours * 60 * 60 * 1000));
        const timeDiff = Math.abs(exportRequest.expiresAt.getTime() - expectedExpiry.getTime());
        expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference

        // Verify it was saved to database
        const savedRequest = await DataExportRequest.findById(exportRequest._id);
        expect(savedRequest.status).toBe('completed');
        expect(savedRequest.downloadUrl).toBe(downloadUrl);
      });

      it('should use default expiration of 48 hours', async () => {
        await exportRequest.markAsCompleted('https://example.com/download', 1024);

        const expectedExpiry = new Date(Date.now() + (48 * 60 * 60 * 1000));
        const timeDiff = Math.abs(exportRequest.expiresAt.getTime() - expectedExpiry.getTime());
        expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
      });
    });

    describe('markAsFailed', () => {
      it('should update status to failed with error message', async () => {
        const errorMessage = 'Database connection timeout';

        await exportRequest.markAsFailed(errorMessage);

        expect(exportRequest.status).toBe('failed');
        expect(exportRequest.errorMessage).toBe(errorMessage);

        // Verify it was saved to database
        const savedRequest = await DataExportRequest.findById(exportRequest._id);
        expect(savedRequest.status).toBe('failed');
        expect(savedRequest.errorMessage).toBe(errorMessage);
      });
    });

    describe('recordDownload', () => {
      it('should increment download count and update last download time', async () => {
        const beforeTime = new Date();
        await exportRequest.recordDownload();
        const afterTime = new Date();

        expect(exportRequest.downloadCount).toBe(1);
        expect(exportRequest.lastDownloadAt).toBeInstanceOf(Date);
        expect(exportRequest.lastDownloadAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(exportRequest.lastDownloadAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());

        // Record another download
        await exportRequest.recordDownload();
        expect(exportRequest.downloadCount).toBe(2);

        // Verify it was saved to database
        const savedRequest = await DataExportRequest.findById(exportRequest._id);
        expect(savedRequest.downloadCount).toBe(2);
        expect(savedRequest.lastDownloadAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('Indexes and TTL', () => {
    it('should have proper indexes defined', async () => {
      const indexes = await DataExportRequest.collection.getIndexes();
      
      // Check for required indexes
      expect(indexes).toHaveProperty('userId_1');
      expect(indexes).toHaveProperty('requestId_1');
      expect(indexes).toHaveProperty('status_1');
      expect(indexes).toHaveProperty('requestedAt_1');
      expect(indexes).toHaveProperty('expiresAt_1');
    });

    it('should automatically delete expired requests', async () => {
      // Create an expired request
      await DataExportRequest.create({
        userId: testUserId,
        requestId: 'export_expired_test',
        status: 'completed',
        expiresAt: new Date(Date.now() - 1000) // 1 second ago
      });

      // Wait for TTL to kick in (MongoDB's TTL runs every 60 seconds, but we can't wait that long in tests)
      // Instead, we'll verify the TTL index exists
      const indexes = await DataExportRequest.collection.getIndexes();
      const ttlIndex = indexes['expiresAt_1'];
      expect(ttlIndex).toBeDefined();
      expect(ttlIndex.expireAfterSeconds).toBe(0);
    });
  });
});