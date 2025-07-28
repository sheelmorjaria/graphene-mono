import EmailMetrics from '../models/EmailMetrics.js';
import logger, { logError } from '../utils/logger.js';

// Get email delivery statistics
export const getDeliveryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await EmailMetrics.getDeliveryStats(start, end);
    
    res.status(200).json({
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      stats
    });
    
  } catch (error) {
    logError(error, { context: 'get_delivery_stats' });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch delivery statistics'
    });
  }
};

// Get email engagement statistics
export const getEngagementStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await EmailMetrics.getEngagementStats(start, end);
    
    res.status(200).json({
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      stats
    });
    
  } catch (error) {
    logError(error, { context: 'get_engagement_stats' });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch engagement statistics'
    });
  }
};

// Get email type breakdown
export const getEmailTypeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await EmailMetrics.getEmailTypeStats(start, end);
    
    res.status(200).json({
      success: true,
      period: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      emailTypes: stats
    });
    
  } catch (error) {
    logError(error, { context: 'get_email_type_stats' });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch email type statistics'
    });
  }
};

// Get recent email activity
export const getRecentEmails = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      status,
      emailType,
      recipient
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (emailType) query.emailType = emailType;
    if (recipient) query.recipient = new RegExp(recipient, 'i');
    
    const skip = (page - 1) * limit;
    
    const [emails, total] = await Promise.all([
      EmailMetrics.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('messageId emailType recipient subject status sentAt engagement.opened engagement.clicked error'),
      EmailMetrics.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logError(error, { context: 'get_recent_emails' });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch recent emails'
    });
  }
};

// Get failed emails
export const getFailedEmails = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    
    const query = {
      $or: [
        { status: 'failed' },
        { status: 'bounced' },
        { status: 'complained' }
      ]
    };
    
    const [emails, total] = await Promise.all([
      EmailMetrics.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('messageId emailType recipient subject status sentAt error events'),
      EmailMetrics.countDocuments(query)
    ]);
    
    res.status(200).json({
      success: true,
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    logError(error, { context: 'get_failed_emails' });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch failed emails'
    });
  }
};

// Get email details
export const getEmailDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const email = await EmailMetrics.findById(id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }
    
    res.status(200).json({
      success: true,
      email
    });
    
  } catch (error) {
    logError(error, { context: 'get_email_details', emailId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch email details'
    });
  }
};

// Dashboard summary
export const getDashboardSummary = async (req, res) => {
  try {
    // Get stats for different time periods
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [todayStats, weekStats, monthStats, topEmails, recentFailed] = await Promise.all([
      EmailMetrics.getDeliveryStats(today, now),
      EmailMetrics.getDeliveryStats(thisWeek, now),
      EmailMetrics.getDeliveryStats(thisMonth, now),
      EmailMetrics.getTopPerformingEmails(5),
      EmailMetrics.find({ 
        $or: [
          { status: 'failed' },
          { status: 'bounced' },
          { status: 'complained' }
        ]
      })
      .sort({ sentAt: -1 })
      .limit(10)
      .select('messageId emailType recipient subject status sentAt')
    ]);
    
    res.status(200).json({
      success: true,
      summary: {
        today: todayStats,
        thisWeek: weekStats,
        thisMonth: monthStats,
        topPerformingEmails: topEmails,
        recentFailures: recentFailed
      }
    });
    
  } catch (error) {
    logError(error, { context: 'get_dashboard_summary' });
    res.status(500).json({
      success: false,
      message: 'Unable to fetch dashboard summary'
    });
  }
};