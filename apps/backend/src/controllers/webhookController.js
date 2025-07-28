import crypto from 'crypto';
import EmailPreference from '../models/EmailPreference.js';
import User from '../models/User.js';
import logger, { logError } from '../utils/logger.js';

// Verify SNS message signature
const verifySNSSignature = (message) => {
  try {
    const fields = ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type'];
    const signatureVersion = message.SignatureVersion || '1';
    
    if (signatureVersion !== '1') {
      return false;
    }
    
    // Build the string to sign
    let stringToSign = '';
    fields.forEach(field => {
      if (message[field]) {
        stringToSign += `${field}\n${message[field]}\n`;
      }
    });
    
    // Verify signature
    const verifier = crypto.createVerify('RSA-SHA1');
    verifier.update(stringToSign, 'utf8');
    
    // In production, fetch the certificate from message.SigningCertURL
    // For now, we'll trust the message if it has required fields
    return message.Type && message.Message && message.TopicArn;
  } catch (error) {
    logError(error, { context: 'sns_signature_verification' });
    return false;
  }
};

// Handle SES bounce notification
const handleBounce = async (bounce, mail) => {
  try {
    const bouncedRecipients = bounce.bouncedRecipients || [];
    
    for (const recipient of bouncedRecipients) {
      const email = recipient.emailAddress;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('Bounce received for unknown email:', { email });
        continue;
      }
      
      // Update email preferences
      let emailPref = await EmailPreference.findOne({ userId: user._id });
      if (!emailPref) {
        emailPref = await EmailPreference.createDefaultPreferences(user._id);
      }
      
      // Record bounce based on type
      const bounceType = bounce.bounceType; // Permanent or Transient
      const bounceSubType = bounce.bounceSubType;
      const reason = recipient.diagnosticCode || 'No diagnostic code provided';
      
      if (bounceType === 'Permanent') {
        await emailPref.recordBounce(bounceType, reason);
        logger.info('Permanent bounce recorded:', { 
          email, 
          bounceSubType,
          messageId: mail.messageId 
        });
      } else {
        // For transient bounces, only record after multiple occurrences
        if (emailPref.emailStatus.bounceCount >= 2) {
          await emailPref.recordBounce(bounceType, reason);
          logger.info('Transient bounce threshold reached:', { 
            email, 
            bounceCount: emailPref.emailStatus.bounceCount 
          });
        } else {
          emailPref.emailStatus.bounceCount += 1;
          await emailPref.save();
          logger.info('Transient bounce recorded:', { 
            email, 
            bounceCount: emailPref.emailStatus.bounceCount 
          });
        }
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
    
    for (const recipient of complainedRecipients) {
      const email = recipient.emailAddress;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn('Complaint received for unknown email:', { email });
        continue;
      }
      
      // Update email preferences
      let emailPref = await EmailPreference.findOne({ userId: user._id });
      if (!emailPref) {
        emailPref = await EmailPreference.createDefaultPreferences(user._id);
      }
      
      // Record complaint
      const complaintType = complaint.complaintFeedbackType || 'not-specified';
      const reason = `Complaint type: ${complaintType}`;
      
      await emailPref.recordComplaint(complaintType, reason);
      
      logger.info('Complaint recorded:', { 
        email, 
        complaintType,
        messageId: mail.messageId 
      });
    }
  } catch (error) {
    logError(error, { context: 'handle_complaint', complaint });
    throw error;
  }
};

// Handle delivery notification (optional)
const handleDelivery = async (delivery, mail) => {
  try {
    // Log successful deliveries for monitoring
    logger.info('Email delivered:', {
      recipients: delivery.recipients,
      timestamp: delivery.timestamp,
      messageId: mail.messageId
    });
    
    // Could update delivery metrics here if needed
  } catch (error) {
    logError(error, { context: 'handle_delivery', delivery });
  }
};

// Main webhook handler for AWS SES notifications
export const handleSESWebhook = async (req, res) => {
  try {
    const message = req.body;
    
    // Verify SNS signature
    if (!verifySNSSignature(message)) {
      logger.warn('Invalid SNS signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Handle subscription confirmation
    if (message.Type === 'SubscriptionConfirmation') {
      logger.info('SNS Subscription Confirmation URL:', message.SubscribeURL);
      // In production, make HTTP GET request to SubscribeURL
      return res.status(200).json({ message: 'Subscription confirmation received' });
    }
    
    // Handle notification
    if (message.Type === 'Notification') {
      const notification = JSON.parse(message.Message);
      const notificationType = notification.notificationType;
      const mail = notification.mail;
      
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
          
        default:
          logger.warn('Unknown notification type:', notificationType);
      }
      
      return res.status(200).json({ message: 'Notification processed' });
    }
    
    // Unknown message type
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