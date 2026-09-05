import User from '../models/User.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import DataExportRequest from '../models/DataExportRequest.js';
import AccountDeletionRequest from '../models/AccountDeletionRequest.js';
import logger, { logError } from '../utils/logger.js';
import { sendDataExportEmail, sendAccountDeletionConfirmationEmail, sendAccountDeletionCompletedEmail } from '../services/emailService.js';

// Request data export
export const requestDataExport = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check for existing active export requests (rate limiting)
    const existingRequests = await DataExportRequest.findActiveByUserId(userId);
    if (existingRequests.length > 0) {
      const lastRequest = existingRequests[0];
      if (lastRequest.status === 'pending' || lastRequest.status === 'processing') {
        return res.status(429).json({
          success: false,
          error: 'You already have a pending data export request. Please wait for it to complete before requesting another.',
          data: {
            existingRequestId: lastRequest.requestId,
            status: lastRequest.status,
            requestedAt: lastRequest.requestedAt
          }
        });
      }
    }
    
    // Create export request record
    const exportRequest = DataExportRequest.createRequest(
      userId, 
      req.ip, 
      req.get('user-agent')
    );
    await exportRequest.save();
    
    // Log the export request for audit purposes
    logger.info('Data export requested', { 
      userId, 
      userEmail: req.user.email,
      requestId: exportRequest.requestId,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // In a real application, you would queue a background job here
    // For now, we'll simulate the process by calling the export function directly
    setTimeout(() => {
      generateDataExport(exportRequest.requestId, userId, req.user.email);
    }, 1000);

    res.json({
      success: true,
      message: 'Data export request received. You will receive an email with a download link when your data is ready.',
      data: {
        requestId: exportRequest.requestId,
        estimatedTime: '24 hours'
      }
    });

  } catch (error) {
    logError(error, { 
      context: 'data_export_request', 
      userId: req.user?._id,
      userEmail: req.user?.email 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error occurred while processing data export request'
    });
  }
};

// Generate and send data export (simulated background worker)
const generateDataExport = async (requestId, userId, userEmail) => {
  let exportRequest;
  const startTime = Date.now();
  
  try {
    // Find the export request
    exportRequest = await DataExportRequest.findOne({ requestId });
    if (!exportRequest) {
      logger.error('Export request not found', { requestId, userId });
      return;
    }

    // Mark as processing
    await exportRequest.markAsProcessing();
    logger.info('Starting data export generation', { requestId, userId, userEmail });

    // Gather all user data
    const user = await User.findById(userId);
    if (!user) {
      await exportRequest.markAsFailed('User not found');
      return;
    }

    const orders = await Order.find({ userId }).populate('items.productId');

    // Compile user data
    const exportData = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        userId: userId,
        requestId: requestId,
        format: 'JSON',
        version: '1.0'
      },
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        accountCreated: user.createdAt,
        lastLogin: user.lastLoginAt,
        accountStatus: user.accountStatus
      },
      addresses: user.shippingAddresses || [],
      orders: orders.map(order => ({
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        currency: order.currency,
        items: order.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        paymentMethod: {
          type: order.paymentMethod?.type
          // Don't include sensitive payment data
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      })),
      preferences: {
        // Add other preferences as they're implemented
      },
      metadata: {
        totalOrders: orders.length,
        totalOrderValue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
        firstOrderDate: orders.length > 0 ? Math.min(...orders.map(o => new Date(o.createdAt))) : null,
        lastOrderDate: orders.length > 0 ? Math.max(...orders.map(o => new Date(o.createdAt))) : null
      }
    };

    // Calculate processing metrics
    const processingTime = Date.now() - startTime;
    const dataSize = JSON.stringify(exportData).length;

    // In a real application, you would:
    // 1. Store the export data in a secure temporary location (S3, etc.)
    // 2. Generate a secure, time-limited download link
    // 3. Send the email with the download link

    // For now, we'll simulate this by creating a mock download URL
    const downloadUrl = `https://secure-exports.graphene-security.com/download/${requestId}`;
    
    // Mark as completed
    await exportRequest.markAsCompleted(downloadUrl, dataSize, 48);
    
    // Update metadata
    exportRequest.metadata = {
      dataTypes: ['profile', 'orders', 'addresses', 'preferences'],
      totalRecords: orders.length + (user.shippingAddresses?.length || 0) + 1, // +1 for profile
      processingTimeMs: processingTime
    };
    await exportRequest.save();

    logger.info('Data export generated successfully', { 
      requestId,
      userId, 
      userEmail,
      dataSize,
      processingTime
    });

    // Send email notification with download link
    await sendDataExportEmail(userEmail, user.firstName, {
      downloadUrl,
      expiresAt: exportRequest.expiresAt
    });

    logger.info('Data export email sent', { requestId, userId, userEmail });

  } catch (error) {
    logError(error, { context: 'data_export_generation', requestId, userId, userEmail });
    
    if (exportRequest) {
      await exportRequest.markAsFailed(error.message);
    }
  }
};

// Request account deletion
export const requestAccountDeletion = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to confirm account deletion'
      });
    }

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed password attempt
      logger.warn('Account deletion failed - invalid password', {
        userId,
        userEmail: req.user.email,
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid password. Please check your password and try again.'
      });
    }

    // Check for existing pending deletion requests
    const existingRequests = await AccountDeletionRequest.findByUserId(userId);
    const pendingRequest = existingRequests.find(req => req.status === 'pending' || req.status === 'processing');
    
    if (pendingRequest) {
      return res.status(429).json({
        success: false,
        error: 'You already have a pending account deletion request.',
        data: {
          existingRequestId: pendingRequest.requestId,
          status: pendingRequest.status,
          requestedAt: pendingRequest.requestedAt
        }
      });
    }

    // Create deletion request record
    const deletionRequest = AccountDeletionRequest.createRequest(
      userId,
      req.user.email,
      `${req.user.firstName} ${req.user.lastName}`,
      req.ip,
      req.get('user-agent')
    );
    await deletionRequest.save();
    
    // Log the deletion request for audit purposes
    logger.info('Account deletion requested', { 
      userId, 
      userEmail: req.user.email,
      requestId: deletionRequest.requestId,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Send confirmation email
    await sendAccountDeletionConfirmationEmail(req.user.email, req.user.firstName, {
      requestId: deletionRequest.requestId,
      estimatedCompletion: '7-30 days'
    });

    // In a real application, you would queue a background job here
    // For now, we'll simulate the process
    setTimeout(() => {
      processAccountDeletion(deletionRequest.requestId, userId, req.user.email);
    }, 5000); // Simulate delay

    res.json({
      success: true,
      message: 'Account deletion request received. You will receive a confirmation email and be logged out.',
      data: {
        requestId: deletionRequest.requestId,
        estimatedTime: '7-30 days'
      }
    });

  } catch (error) {
    logError(error, { 
      context: 'account_deletion_request', 
      userId: req.user?._id,
      userEmail: req.user?.email 
    });
    
    res.status(500).json({
      success: false,
      error: 'Server error occurred while processing account deletion request'
    });
  }
};

// Process account deletion (simulated background worker)
const processAccountDeletion = async (requestId, userId, userEmail) => {
  let deletionRequest;
  const startTime = Date.now();
  
  try {
    // Find the deletion request
    deletionRequest = await AccountDeletionRequest.findOne({ requestId });
    if (!deletionRequest) {
      logger.error('Deletion request not found', { requestId, userId });
      return;
    }

    // Mark as processing
    await deletionRequest.markAsProcessing();
    logger.info('Starting account deletion process', { requestId, userId, userEmail });

    const user = await User.findById(userId);
    if (!user) {
      await deletionRequest.markAsFailed('User not found');
      logger.warn('User not found for deletion', { requestId, userId });
      return;
    }

    let ordersAnonymized = 0;
    let recordsDeleted = 0;

    // Step 1: Anonymize order data (keep for legal/tax purposes)
    // NOTE: the Order schema field is `customerEmail` (not `userEmail`).
    // Anonymize the correct field so the customer's real email is actually
    // removed (GDPR right to erasure).
    const orderUpdateResult = await Order.updateMany(
      { userId },
      {
        $set: {
          'shippingAddress.fullName': 'DELETED USER',
          'shippingAddress.phoneNumber': '',
          'billingAddress.fullName': 'DELETED USER',
          'billingAddress.phoneNumber': '',
          customerEmail: 'deleted@anonymous.local',
          userId: null // Remove user reference
        }
      }
    );
    ordersAnonymized = orderUpdateResult.modifiedCount;

    // Step 2: Delete user's personal data (soft deletion with anonymization)
    // NOTE: the User schema has no `isDeleted`/`deletedAt` fields, so setting
    // them would be silently stripped by the strict schema. Use the existing
    // `isActive` and `accountStatus` fields to mark the account as disabled.
    await User.findByIdAndUpdate(userId, {
      firstName: 'Deleted',
      lastName: 'User',
      email: `deleted_${userId}@anonymous.local`,
      phone: '',
      shippingAddresses: [],
      isActive: false,
      accountStatus: 'disabled',
      // Keep account for audit purposes but remove PII
      password: 'DELETED' // This will prevent login
    });

    // Step 3: Delete associated carts
    const cartDeleteResult = await Cart.deleteMany({ userId });
    recordsDeleted += cartDeleteResult.deletedCount;

    // Step 4: Calculate processing metrics
    const processingTime = Date.now() - startTime;
    
    // Mark as completed with metadata
    await deletionRequest.markAsCompleted({
      ordersAnonymized,
      recordsDeleted,
      processingTimeMs: processingTime,
      dataRetentionPolicyVersion: '1.0'
    });

    // Step 5: Log completion
    logger.info('Account deletion completed', { 
      requestId,
      userId, 
      userEmail,
      ordersAnonymized,
      recordsDeleted,
      processingTime
    });

    // Step 6: Send final notification email
    await sendAccountDeletionCompletedEmail(userEmail, deletionRequest.userName.split(' ')[0]);

  } catch (error) {
    logError(error, { context: 'account_deletion_processing', requestId, userId, userEmail });
    
    if (deletionRequest) {
      await deletionRequest.markAsFailed(error.message);
    }
  }
};