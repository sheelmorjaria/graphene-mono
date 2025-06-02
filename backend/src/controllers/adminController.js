import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Admin login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' } // 8 hours for admin sessions
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// Get dashboard metrics
export const getDashboardMetrics = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.setDate(now.getDate() - 7));
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Reset now for subsequent calculations
    const currentDate = new Date();

    // Get order metrics
    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      awaitingShipmentOrders,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      newCustomersToday,
      newCustomersWeek,
      newCustomersMonth
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({}),
      
      // Today's orders
      Order.countDocuments({
        createdAt: { $gte: today }
      }),
      
      // This week's orders
      Order.countDocuments({
        createdAt: { $gte: thisWeek }
      }),
      
      // This month's orders
      Order.countDocuments({
        createdAt: { $gte: thisMonth }
      }),
      
      // Pending orders
      Order.countDocuments({
        status: { $in: ['pending', 'processing'] }
      }),
      
      // Orders awaiting shipment
      Order.countDocuments({
        status: 'awaiting_shipment'
      }),
      
      // Total revenue
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // Today's revenue
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: today },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // This week's revenue
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thisWeek },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // This month's revenue
      Order.aggregate([
        { 
          $match: { 
            createdAt: { $gte: thisMonth },
            status: { $ne: 'cancelled' }
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      
      // New customers today
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: today }
      }),
      
      // New customers this week
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: thisWeek }
      }),
      
      // New customers this month
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: thisMonth }
      })
    ]);

    // Format the response
    const metrics = {
      orders: {
        total: totalOrders,
        today: todayOrders,
        week: weekOrders,
        month: monthOrders,
        pending: pendingOrders,
        awaitingShipment: awaitingShipmentOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0,
        week: weekRevenue[0]?.total || 0,
        month: monthRevenue[0]?.total || 0
      },
      customers: {
        newToday: newCustomersToday,
        newWeek: newCustomersWeek,
        newMonth: newCustomersMonth
      },
      lastUpdated: currentDate
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching dashboard metrics'
    });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching admin profile'
    });
  }
};