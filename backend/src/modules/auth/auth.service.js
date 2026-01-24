import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/env.js';

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

export default { signup, login, getCurrentUser };
