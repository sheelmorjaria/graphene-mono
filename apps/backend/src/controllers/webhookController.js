import crypto from 'crypto';
import https from 'https';
import EmailPreference from '../models/EmailPreference.js';
import User from '../models/User.js';
import EmailMetrics from '../models/EmailMetrics.js';
import logger, { logError } from '../utils/logger.js';

// Fetch certificate from AWS SNS
const fetchCertificate = (url) => {
  return new Promise((resolve, reject) => {
    // Verify the certificate URL is from AWS
    const urlPattern = /^https:\/\/sns\.[a-zA-Z0-9-]+\.amazonaws\.com\//;
    if (!urlPattern.test(url)) {
      reject(new Error('Invalid certificate URL'));
      return;
    }
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
};

// Verify SNS message signature
const verifySNSSignature = async (message) => {
  try {
    const signatureVersion = message.SignatureVersion || '1';
    
    if (signatureVersion !== '1' && signatureVersion !== '2') {
      logger.warn('Unsupported SNS signature version:', signatureVersion);
      return false;
    }
    
    // Fields to include in signature string
    const fields = message.Type === 'SubscriptionConfirmation' || message.Type === 'UnsubscribeConfirmation'
      ? ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'];
    
    // Build the string to sign
    let stringToSign = '';
    fields.forEach(field => {
      if (message[field] !== undefined) {
        stringToSign += `${field}\n${message[field]}\n`;
      }
    });
    
    // In development, skip signature verification if explicitly disabled
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_SNS_VERIFICATION === 'true') {
      logger.warn('SNS signature verification skipped (development mode)');
      return true;
    }
    
    // Fetch the certificate
    const certificate = await fetchCertificate(message.SigningCertURL);
    
    // Verify signature
    const verifier = crypto.createVerify(signatureVersion === '1' ? 'RSA-SHA1' : 'RSA-SHA256');
    verifier.update(stringToSign, 'utf8');
    const isValid = verifier.verify(certificate, message.Signature, 'base64');
    
    if (!isValid) {
      logger.warn('SNS signature verification failed');
    }
    
    return isValid;
  } catch (error) {
    logError(error, { context: 'sns_signature_verification' });
    return false;
  }
};

// Handle SES bounce notification
const handleBounce = async (bounce, mail) => {
  try {
    const bouncedRecipients = bounce.bouncedRecipients || [];
    const bounceType = bounce.bounceType; // Permanent or Transient
    const bounceSubType = bounce.bounceSubType;
    const timestamp = bounce.timestamp || new Date().toISOString();
    
    // Update EmailMetrics for the original email
    if (mail.messageId) {
      const metrics = await EmailMetrics.findOne({ 
        'metadata.sesMessageId': mail.messageId 
      });
      
      if (metrics) {
        await metrics.recordEvent('bounced', {
          bounceType,
          bounceSubType,
          recipients: bouncedRecipients.map(r => r.emailAddress),
          timestamp
        });
        logger.info('EmailMetrics updated for bounce:', { 
          messageId: mail.messageId,
          bounceType 
        });
      }
    }
    
    // Process each bounced recipient
    for (const recipient of bouncedRecipients) {
      const email = recipient.emailAddress;
      const diagnosticCode = recipient.diagnosticCode || '';
      const status = recipient.status || '';
      const action = recipient.action || '';
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('Bounce received for unknown email:', { 
          email,
          bounceType,
          bounceSubType 
        });
        continue;
      }
      
      // Update email preferences
      let emailPref = await EmailPreference.findOne({ userId: user._id });
      if (!emailPref) {
        emailPref = await EmailPreference.createDefaultPreferences(user._id);
      }
      
      // Build detailed reason
      const reason = `Type: ${bounceType}/${bounceSubType}, Status: ${status}, Action: ${action}, Diagnostic: ${diagnosticCode}`;
      
      if (bounceType === 'Permanent') {
        // Permanent bounces immediately mark email as invalid
        await emailPref.recordBounce(bounceType, reason);
        
        // Log important permanent bounces
        logger.warn('Permanent bounce recorded:', { 
          email, 
          bounceType,
          bounceSubType,
          status,
          action,
          messageId: mail.messageId 
        });
        
        // Optionally notify admin for critical bounces
        if (bounceSubType === 'General' || bounceSubType === 'NoEmail') {
          logger.error('Critical permanent bounce:', {
            email,
            bounceSubType,
            diagnosticCode
          });
        }
      } else if (bounceType === 'Transient') {
        // For transient bounces, increment counter
        emailPref.emailStatus.bounceCount = (emailPref.emailStatus.bounceCount || 0) + 1;
        emailPref.emailStatus.lastBounceDate = new Date();
        emailPref.emailStatus.lastBounceReason = reason;
        
        // After 3 transient bounces within 7 days, mark as bounced
        const recentBounces = await EmailMetrics.countDocuments({
          recipient: email,
          status: 'bounced',
          sentAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });
        
        if (recentBounces >= 3) {
          await emailPref.recordBounce(bounceType, `Multiple transient bounces: ${reason}`);
          logger.warn('Transient bounce threshold reached:', { 
            email, 
            bounceCount: recentBounces,
            reason 
          });
        } else {
          await emailPref.save();
          logger.info('Transient bounce recorded:', { 
            email, 
            bounceCount: emailPref.emailStatus.bounceCount,
            bounceSubType 
          });
        }
      } else if (bounceType === 'Undetermined') {
        // Log undetermined bounces for investigation
        logger.warn('Undetermined bounce received:', {
          email,
          diagnosticCode,
          messageId: mail.messageId
        });
        
        // Treat as transient
        emailPref.emailStatus.bounceCount = (emailPref.emailStatus.bounceCount || 0) + 1;
        await emailPref.save();
      }
    }
  } catch (error) {
    logError(error, { context: 'handle_bounce', bounce });
    throw error;
  }
};

// Handle SES complaint notification
const handleComplaint = async (complaint, mail) => {
  try {
    const complainedRecipients = complaint.complainedRecipients || [];
    const complaintFeedbackType = complaint.complaintFeedbackType || 'not-specified';
    const timestamp = complaint.timestamp || new Date().toISOString();
    const userAgent = complaint.userAgent || 'Unknown';
    const complaintSubType = complaint.complaintSubType;
    
    // Update EmailMetrics for the original email
    if (mail.messageId) {
      const metrics = await EmailMetrics.findOne({ 
        'metadata.sesMessageId': mail.messageId 
      });
      
      if (metrics) {
        await metrics.recordEvent('complained', {
          complaintFeedbackType,
          complaintSubType,
          recipients: complainedRecipients.map(r => r.emailAddress),
          userAgent,
          timestamp
        });
        logger.info('EmailMetrics updated for complaint:', { 
          messageId: mail.messageId,
          complaintFeedbackType 
        });
      }
    }
    
    // Process each complained recipient
    for (const recipient of complainedRecipients) {
      const email = recipient.emailAddress;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('Complaint received for unknown email:', { 
          email,
          complaintFeedbackType 
        });
        // Still important to log complaints for unknown emails
        logger.error('Complaint from non-user email:', {
          email,
          complaintFeedbackType,
          messageId: mail.messageId
        });
        continue;
      }
      
      // Update email preferences
      let emailPref = await EmailPreference.findOne({ userId: user._id });
      if (!emailPref) {
        emailPref = await EmailPreference.createDefaultPreferences(user._id);
      }
      
      // Build detailed reason
      const reason = `Type: ${complaintFeedbackType}, SubType: ${complaintSubType || 'N/A'}, UserAgent: ${userAgent}`;
      
      // Record complaint - this should immediately stop all non-essential emails
      await emailPref.recordComplaint(complaintFeedbackType, reason);
      
      // Log complaint with appropriate severity
      const logData = { 
        email, 
        complaintFeedbackType,
        complaintSubType,
        userAgent,
        messageId: mail.messageId,
        userId: user._id 
      };
      
      // Different severity based on complaint type
      if (complaintFeedbackType === 'abuse') {
        logger.error('Abuse complaint received:', logData);
        // Could trigger additional actions like admin notification
      } else if (complaintFeedbackType === 'auth-failure') {
        logger.error('Authentication failure complaint:', logData);
      } else if (complaintFeedbackType === 'fraud') {
        logger.error('Fraud complaint received:', logData);
      } else if (complaintFeedbackType === 'not-spam') {
        logger.info('Not-spam complaint (false positive):', logData);
      } else if (complaintFeedbackType === 'other') {
        logger.warn('Other type complaint received:', logData);
      } else if (complaintFeedbackType === 'virus') {
        logger.error('Virus complaint received:', logData);
      } else {
        logger.warn('Complaint recorded:', logData);
      }
    }
  } catch (error) {
    logError(error, { context: 'handle_complaint', complaint });
    throw error;
  }
};

// Handle delivery notification
const handleDelivery = async (delivery, mail) => {
  try {
    const timestamp = delivery.timestamp || new Date().toISOString();
    const processingTimeMillis = delivery.processingTimeMillis;
    const smtpResponse = delivery.smtpResponse;
    
    // Update EmailMetrics for the delivered email
    if (mail.messageId) {
      const metrics = await EmailMetrics.findOne({ 
        'metadata.sesMessageId': mail.messageId 
      });
      
      if (metrics) {
        await metrics.recordEvent('delivered', {
          recipients: delivery.recipients,
          processingTimeMillis,
          smtpResponse,
          timestamp
        });
        
        logger.debug('Email delivery confirmed:', {
          messageId: mail.messageId,
          recipients: delivery.recipients,
          processingTime: `${processingTimeMillis}ms`
        });
      } else {
        logger.warn('Delivery notification for unknown message:', {
          messageId: mail.messageId,
          recipients: delivery.recipients
        });
      }
    }
    
    // Update user email status to mark as valid
    for (const recipientEmail of delivery.recipients) {
      const user = await User.findOne({ email: recipientEmail });
      if (user) {
        const emailPref = await EmailPreference.findOne({ userId: user._id });
        if (emailPref && !emailPref.emailStatus.isValid) {
          emailPref.emailStatus.isValid = true;
          emailPref.emailStatus.lastValidatedAt = new Date();
          await emailPref.save();
          logger.debug('Email marked as valid after successful delivery:', recipientEmail);
        }
      }
    }
  } catch (error) {
    logError(error, { context: 'handle_delivery', delivery });
    // Don't throw - delivery notifications are not critical
  }
};

// Handle subscription confirmation
const confirmSubscription = async (subscribeURL) => {
  return new Promise((resolve, reject) => {
    https.get(subscribeURL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        logger.info('SNS subscription confirmed:', { response: data });
        resolve(data);
      });
    }).on('error', (error) => {
      logError(error, { context: 'sns_subscription_confirmation' });
      reject(error);
    });
  });
};

// Main webhook handler for AWS SES notifications
export const handleSESWebhook = async (req, res) => {
  try {
    // Parse the raw body if needed
    let message;
    if (typeof req.body === 'string') {
      try {
        message = JSON.parse(req.body);
      } catch (parseError) {
        logger.error('Failed to parse SNS message:', { body: req.body });
        return res.status(400).json({ error: 'Invalid JSON' });
      }
    } else {
      message = req.body;
    }
    
    // Log the message type for monitoring
    logger.info('SNS message received:', { 
      messageType: message.Type,
      topicArn: message.TopicArn 
    });
    
    // Verify SNS signature
    const isValidSignature = await verifySNSSignature(message);
    if (!isValidSignature) {
      logger.error('Invalid SNS signature:', { 
        messageId: message.MessageId,
        type: message.Type 
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Handle subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      logger.info('SNS Subscription Confirmation received:', {
        topicArn: message.TopicArn,
        token: message.Token
      });
      
      // Automatically confirm the subscription
      if (message.SubscribeURL) {
        try {
          await confirmSubscription(message.SubscribeURL);
          logger.info('SNS subscription confirmed successfully');
        } catch (error) {
          logger.error('Failed to confirm SNS subscription:', error);
        }
      }
      
      return res.status(200).json({ 
        success: true,
        message: 'Subscription confirmation processed' 
      });
    }
    
    // Handle unsubscribe confirmation
    if (message.Type === 'UnsubscribeConfirmation') {
      logger.warn('SNS Unsubscribe confirmation received:', {
        topicArn: message.TopicArn
      });
      return res.status(200).json({ 
        success: true,
        message: 'Unsubscribe confirmation received' 
      });
    }
    
    // Handle notification
    if (message.Type === 'Notification') {
      let notification;
      try {
        notification = typeof message.Message === 'string' 
          ? JSON.parse(message.Message) 
          : message.Message;
      } catch (parseError) {
        logger.error('Failed to parse notification message:', { 
          error: parseError.message 
        });
        return res.status(400).json({ error: 'Invalid notification format' });
      }
      
      const notificationType = notification.notificationType || notification.eventType;
      const mail = notification.mail;
      
      // Log notification for monitoring
      logger.info('Processing SES notification:', {
        notificationType,
        messageId: mail?.messageId,
        destination: mail?.destination
      });
      
      try {
        switch (notificationType) {
        case 'Bounce':
          await handleBounce(notification.bounce, mail);
          break;
            
        case 'Complaint':
          await handleComplaint(notification.complaint, mail);
          break;
            
        case 'Delivery':
          await handleDelivery(notification.delivery, mail);
          break;
            
        case 'Send':
          // Log send events but don't process
          logger.debug('Send event received:', { messageId: mail?.messageId });
          break;
            
        case 'Reject':
          logger.error('Email rejected by SES:', {
            reason: notification.reject?.reason,
            messageId: mail?.messageId
          });
          break;
            
        case 'Open':
          // Track email opens if available
          logger.debug('Email opened:', { messageId: mail?.messageId });
          break;
            
        case 'Click':
          // Track link clicks if available
          logger.debug('Email link clicked:', { 
            messageId: mail?.messageId,
            link: notification.click?.link 
          });
          break;
            
        case 'Rendering Failure':
          logger.error('Email rendering failure:', {
            templateName: notification.failure?.templateName,
            errorMessage: notification.failure?.errorMessage
          });
          break;
            
        default:
          logger.warn('Unknown notification type:', { 
            notificationType,
            messageId: mail?.messageId 
          });
        }
        
        return res.status(200).json({ 
          success: true,
          message: 'Notification processed',
          type: notificationType 
        });
      } catch (processingError) {
        logger.error('Error processing notification:', {
          error: processingError.message,
          notificationType,
          messageId: mail?.messageId
        });
        // Return 200 to prevent SNS from retrying
        return res.status(200).json({ 
          success: false,
          message: 'Notification processing failed but acknowledged' 
        });
      }
    }
    
    // Unknown message type
    logger.warn('Unknown SNS message type:', { type: message.Type });
    return res.status(400).json({ error: 'Unknown message type' });
    
  } catch (error) {
    logError(error, { context: 'ses_webhook' });
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Unsubscribe handler
export const handleUnsubscribe = async (req, res) => {
  try {
    const { token } = req.params;
    const { category, all } = req.query;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid unsubscribe link' 
      });
    }
    
    // Find email preference by token
    const emailPref = await EmailPreference.findByUnsubscribeToken(token);
    if (!emailPref) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or expired unsubscribe link' 
      });
    }
    
    // Handle unsubscribe
    if (all === 'true') {
      // Global unsubscribe
      await emailPref.updatePreferences({
        globalUnsubscribe: true,
        reason: 'User clicked unsubscribe all'
      }, 'user');
      
      return res.status(200).json({ 
        success: true, 
        message: 'You have been unsubscribed from all non-essential emails' 
      });
    } else if (category) {
      // Category-specific unsubscribe
      const updates = {};
      
      if (category === 'marketing') {
        updates.marketing = {
          promotions: false,
          newsletter: false,
          productRecommendations: false,
          surveyInvitations: false
        };
      } else if (category === 'notifications') {
        updates.notifications = {
          orderStatusUpdates: false,
          deliveryUpdates: false,
          priceDropAlerts: false,
          backInStockAlerts: false,
          newProductAlerts: false
        };
      }
      
      await emailPref.updatePreferences({
        ...updates,
        reason: `User unsubscribed from ${category}`
      }, 'user');
      
      return res.status(200).json({ 
        success: true, 
        message: `You have been unsubscribed from ${category} emails` 
      });
    }
    
    // Default: unsubscribe from marketing
    await emailPref.updatePreferences({
      marketing: {
        promotions: false,
        newsletter: false,
        productRecommendations: false,
        surveyInvitations: false
      },
      reason: 'User clicked unsubscribe'
    }, 'user');
    
    return res.status(200).json({ 
      success: true, 
      message: 'You have been unsubscribed from marketing emails' 
    });
    
  } catch (error) {
    logError(error, { context: 'unsubscribe_handler' });
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to process unsubscribe request' 
    });
  }
};

// Email preferences API for user profile
export const getEmailPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let emailPref = await EmailPreference.findOne({ userId });
    if (!emailPref) {
      emailPref = await EmailPreference.createDefaultPreferences(userId);
    }
    
    // Don't expose sensitive fields
    const preferences = {
      notifications: emailPref.notifications,
      marketing: emailPref.marketing,
      globalUnsubscribe: emailPref.globalUnsubscribe,
      emailStatus: {
        isValid: emailPref.emailStatus.isValid
      }
    };
    
    res.status(200).json({
      success: true,
      preferences
    });
    
  } catch (error) {
    logError(error, { context: 'get_email_preferences', userId: req.user._id });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch email preferences'
    });
  }
};

export const updateEmailPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;
    
    let emailPref = await EmailPreference.findOne({ userId });
    if (!emailPref) {
      emailPref = await EmailPreference.createDefaultPreferences(userId);
    }
    
    // Validate updates
    const allowedUpdates = ['notifications', 'marketing', 'globalUnsubscribe'];
    const isValidUpdate = Object.keys(updates).every(key => allowedUpdates.includes(key));
    
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preference update'
      });
    }
    
    // Update preferences
    await emailPref.updatePreferences(updates, 'user');
    
    res.status(200).json({
      success: true,
      message: 'Email preferences updated successfully',
      preferences: {
        notifications: emailPref.notifications,
        marketing: emailPref.marketing,
        globalUnsubscribe: emailPref.globalUnsubscribe
      }
    });
    
  } catch (error) {
    logError(error, { context: 'update_email_preferences', userId: req.user._id });
    res.status(500).json({
      success: false,
      message: 'Unable to update email preferences'
    });
  }
};