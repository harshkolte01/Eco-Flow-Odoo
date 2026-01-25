import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';
import { validatePassword } from '../../utils/passwordValidator.js';
import { 
  generateResetToken, 
  hashToken, 
  verifyToken, 
  getTokenExpiry 
} from '../../utils/tokenGenerator.js';
import emailService from '../../utils/emailService.js';

/**
 * Auth Service
 * Business logic for authentication operations
 */

/**
 * Generate JWT token
 * @param {Object} user - User object with id, email, and role
 * @returns {String} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    role: user.role.name,
    email: user.email
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

/**
 * Format user response (exclude sensitive data)
 * @param {Object} user - User object from database
 * @returns {Object} Formatted user object
 */
const formatUserResponse = (user) => {
  return {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    email: user.email,
    role: user.role.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

/**
 * Signup new user
 * @param {Object} data - { loginId, name, email, password }
 * @returns {Object} { user, token }
 */
export const signup = async ({ loginId, name, email, password }) => {
  // Check if loginId already exists
  const existingLoginId = await prisma.user.findUnique({
    where: { loginId }
  });

  if (existingLoginId) {
    const error = new Error('Login ID already taken');
    error.statusCode = 409;
    throw error;
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  // Find engineering role
  const engineeringRole = await prisma.role.findUnique({
    where: { name: 'engineering' }
  });

  if (!engineeringRole) {
    const error = new Error('Engineering role not found. Please run database seed.');
    error.statusCode = 500;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user with engineering role
  const user = await prisma.user.create({
    data: {
      loginId,
      name,
      email,
      passwordHash,
      roleId: engineeringRole.id
    },
    include: {
      role: true
    }
  });

  // Generate token
  const token = generateToken(user);

  return {
    user: formatUserResponse(user),
    token
  };
};

/**
 * Login user
 * @param {Object} data - { loginId, password }
 * @returns {Object} { user, token }
 */
export const login = async ({ loginId, password }) => {
  // Find user by loginId
  const user = await prisma.user.findUnique({
    where: { loginId },
    include: { role: true }
  });

  // If user not found or password mismatch, return generic error
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Generate token
  const token = generateToken(user);

  return {
    user: formatUserResponse(user),
    token
  };
};

/**
 * Get current user by ID
 * @param {Number} userId - User ID from JWT
 * @returns {Object} User object
 */
export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return formatUserResponse(user);
};

/**
 * Change password for authenticated user
 * Requires verification of old password
 * @param {Number} userId - User ID from JWT
 * @param {String} oldPassword - Current password
 * @param {String} newPassword - New password
 * @returns {Object} Success message
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  // Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    const error = new Error('Password does not meet requirements');
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }
  
  // Find user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Verify old password
  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isOldPasswordValid) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }
  
  // Prevent using same password
  const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
  if (isSamePassword) {
    const error = new Error('New password cannot be the same as current password');
    error.statusCode = 400;
    throw error;
  }
  
  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  
  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newPasswordHash,
      lastPasswordChangeAt: new Date()
    }
  });
  
  return { success: true, message: 'Password changed successfully' };
};

/**
 * Request password reset
 * Generates reset token and sends it via email
 * @param {String} email - User email address
 * @returns {Object} Success message
 */
export const requestPasswordReset = async (email) => {
  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Don't reveal if email exists (security best practice)
  if (!user) {
    return { 
      success: true, 
      message: 'If your email is registered, you will receive a password reset link shortly'
    };
  }
  
  // Invalidate previous unused tokens
  await prisma.passwordResetToken.deleteMany({
    where: { 
      userId: user.id, 
      usedAt: null 
    }
  });
  
  // Generate new token
  const resetToken = generateResetToken();
  const tokenHash = hashToken(resetToken);
  const expiresAt = getTokenExpiry(1); // 1 hour expiry
  
  // Store token in database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token: tokenHash,
      expiresAt
    }
  });
  
  // Check if email service is available
  if (emailService.isAvailable()) {
    // Production: Send email with reset link and token
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email, 
      resetToken, 
      user.name
    );
    
    if (emailSent) {
      return {
        success: true,
        message: 'Password reset instructions have been sent to your email'
      };
    } else {
      // Email failed but don't expose this to user
      console.error('Failed to send password reset email to:', user.email);
      return {
        success: true,
        message: 'If your email is registered, you will receive a password reset link shortly'
      };
    }
  } else {
    // MVP/Fallback: Return token directly when email is not configured
    console.warn('⚠️  Email service not available. Returning token directly (MVP mode).');
    return {
      success: true,
      message: 'If email exists, reset instructions have been sent',
      resetToken, // For MVP - only when email service unavailable
      email: user.email // For MVP - only when email service unavailable
    };
  }
};

/**
 * Reset password using token
 * @param {String} email - User email address
 * @param {String} resetToken - Reset token from email
 * @param {String} newPassword - New password
 * @returns {Object} Success message
 */
export const resetPassword = async (email, resetToken, newPassword) => {
  // Validate new password
  const validation = validatePassword(newPassword);
  if (!validation.isValid) {
    const error = new Error('Password does not meet requirements');
    error.statusCode = 400;
    error.details = validation.errors;
    throw error;
  }
  
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('Invalid reset token');
    error.statusCode = 400;
    throw error;
  }
  
  // Find valid reset token
  const tokenRecord = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      expiresAt: { gt: new Date() }, // Not expired
      usedAt: null // Not already used
    },
    orderBy: {
      createdAt: 'desc' // Get most recent
    }
  });
  
  if (!tokenRecord) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }
  
  // Verify token
  const isTokenValid = verifyToken(resetToken, tokenRecord.token);
  if (!isTokenValid) {
    const error = new Error('Invalid reset token');
    error.statusCode = 400;
    throw error;
  }
  
  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  
  // Update password and mark token as used (transaction)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        lastPasswordChangeAt: new Date()
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() }
    })
  ]);
  
  return { success: true, message: 'Password reset successfully' };
};

export default { signup, login, getCurrentUser, changePassword, requestPasswordReset, resetPassword };
