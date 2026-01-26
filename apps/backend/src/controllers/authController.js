import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Helper function to validate password strength
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }

  return null; // Valid password
};

// Register new user
export const register = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      marketingOptIn = false
    } = req.body;

    // Input validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required'
      });
    }

    // Password confirmation validation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // Password strength validation
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        error: passwordError
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Validate phone number if provided
    if (phone) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid phone number'
        });
      }
    }

    // Create new user
    const userData = {
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      marketingOptIn: Boolean(marketingOptIn)
    };

    if (phone) {
      userData.phone = phone.trim();
    }

    const user = new User(userData);
    await user.save();

    // Generate JWT token for automatic login
    const token = generateToken(user._id);

    // Generate email verification token and send welcome email
    const emailVerificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Send welcome email with verification token
    try {
      const emailResult = await sendWelcomeEmail(user.email, emailVerificationToken, {
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      if (emailResult.success) {
        console.log(`Welcome email sent successfully to: ${user.email}`, { messageId: emailResult.messageId });
      } else {
        console.error(`Failed to send welcome email to: ${user.email}`, { error: emailResult.error });
      }
    } catch (emailError) {
      console.error(`Email service error for user: ${user.email}`, { error: emailError.message });
    }

    // Return success response with token and user data
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: user.toJSON(),
        emailVerificationRequired: true
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join('. ')
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Server error occurred during registration'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
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
        error: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Check if account status is disabled
    if (user.accountStatus === 'disabled') {
      return res.status(401).json({
        success: false,
        error: 'Account has been disabled. Please contact support for assistance.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred during login'
    });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toJSON ? user.toJSON() : user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while fetching profile'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware
    const {
      firstName,
      lastName,
      phone,
      marketingOptIn
    } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update allowed fields
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (phone !== undefined) {
      if (phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({
            success: false,
            error: 'Please enter a valid phone number'
          });
        }
        user.phone = phone.trim();
      } else {
        user.phone = undefined;
      }
    }
    if (marketingOptIn !== undefined) user.marketingOptIn = Boolean(marketingOptIn);

    if (user.save) {
      await user.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON ? user.toJSON() : user
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while updating profile'
    });
  }
};

// In-memory token blacklist (for production, use Redis or database)
const tokenBlacklist = new Set();

// Logout user
export const logout = async (req, res) => {
  try {
    const token = req.token; // Set by authentication middleware
    const user = req.user; // Set by authentication middleware

    // Add token to blacklist
    tokenBlacklist.add(token);

    // Log the logout event
    console.log(`User ${user.email} logged out at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred during logout'
    });
  }
};

// Check if token is blacklisted
export const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const user = req.user; // Set by authentication middleware
    const token = req.token; // Set by authentication middleware
    const {
      currentPassword,
      newPassword,
      confirmNewPassword
    } = req.body;

    // Input validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password, new password, and confirmation are required'
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password'
      });
    }

    // Validate new password strength
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        error: passwordError
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate current token to force re-authentication
    tokenBlacklist.add(token);

    // Log the password change event
    console.log(`Password changed for user ${user.email} at ${new Date().toISOString()}`);

    // TODO: Send password change notification email
    // await sendPasswordChangeNotification(user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while changing password'
    });
  }
};

// Forgot password - send reset token
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid email address'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    
    // Always return the same response to prevent email enumeration
    const standardResponse = {
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.'
    };

    // If user doesn't exist or is inactive, return standard response but don't send email
    if (!user || !user.isActive) {
      return res.json(standardResponse);
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      const emailResult = await sendPasswordResetEmail(user.email, resetToken, {
        firstName: user.firstName,
        lastName: user.lastName
      });

      if (emailResult.success) {
        console.log(`Password reset email sent successfully to: ${user.email}`, { messageId: emailResult.messageId });
      } else {
        console.error(`Failed to send password reset email to: ${user.email}`, { error: emailResult.error });
      }
    } catch (emailError) {
      console.error(`Email service error for password reset: ${user.email}`, { error: emailError.message });
    }

    res.json(standardResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error occurred while processing password reset request'
    });
  }
};

// Verify email with token
export const verifyEmail = async (req, res) => {
  try {
    // Get token from either URL params or query string
    const token = req.params.token || req.query.token;

    // Input validation
    if (!token) {
      // Return HTML page for browser access
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification Failed</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>No verification token provided.</p>
          <a href="${process.env.FRONTEND_URL || 'https://graphene-security.com'}/login" class="btn">Go to Login</a>
        </body>
        </html>
      `);
    }

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      // Return HTML page for invalid/expired token
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Email Verification Failed</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; }
            .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Failed</h1>
          <p>The verification link is invalid or has expired.</p>
          <p>Please register again or contact support.</p>
          <a href="${process.env.FRONTEND_URL || 'https://graphene-security.com'}/register" class="btn">Register Again</a>
        </body>
        </html>
      `);
    }

    // Mark email as verified and clear token
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Log the verification event
    console.log(`Email verified for user ${user.email} at ${new Date().toISOString()}`);

    // Return success HTML page with auto-redirect
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified Successfully</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="3;url=${process.env.FRONTEND_URL || 'https://graphene-security.com'}/login?verified=true">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #28a745; }
          .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1 class="success">✓ Email Verified Successfully!</h1>
        <p>Your email address has been verified.</p>
        <p>You will be redirected to the login page in 3 seconds...</p>
        <a href="${process.env.FRONTEND_URL || 'https://graphene-security.com'}/login?verified=true" class="btn">Go to Login Now</a>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Email verification error:', error);
    
    // Return error HTML page
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc3545; }
          .btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1 class="error">Verification Error</h1>
        <p>An error occurred during email verification.</p>
        <p>Please try again or contact support.</p>
        <a href="${process.env.FRONTEND_URL || 'https://graphene-security.com'}/contact-us" class="btn">Contact Support</a>
      </body>
      </html>
    `);
  }
};

// Reset password with token
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmNewPassword } = req.body;

    // Input validation
    if (!token || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token, new password, and confirmation are required'
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match'
      });
    }

    // Validate new password strength
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        error: passwordError
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Password reset token is invalid or has expired'
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log the password reset event
    console.log(`Password reset completed for user ${user.email} at ${new Date().toISOString()}`);

    // TODO: Send password reset confirmation email
    // await sendPasswordResetConfirmationEmail(user.email);

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: validationErrors.join('. ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error occurred while resetting password'
    });
  }
};