import User from '../models/User.js';
import { randomBytes } from 'crypto';
import emailService from '../services/emailService.js';

export const createAdminUser = async (req, res) => {
  try {
    const { email, firstName, lastName } = req.body;

    // Extra security: Check if requester is super admin
    if (req.user.email !== process.env.SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        error: 'Only super admin can create new admin users'
      });
    }

    // Validate input
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, first name, and last name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Generate secure temporary password
    const tempPassword = randomBytes(16).toString('base64').slice(0, 16) + '!Aa1';

    // Create admin user
    const adminUser = new User({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'admin',
      isActive: true,
      emailVerified: true
    });

    await adminUser.save();

    // Send email with temporary password
    await emailService.sendAdminWelcomeEmail({
      email: adminUser.email,
      firstName: adminUser.firstName,
      tempPassword
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully. Temporary password sent via email.',
      data: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName
      }
    });

  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user'
    });
  }
};