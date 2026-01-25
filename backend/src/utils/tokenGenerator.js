import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Token Generator Utility
 * Handles generation and verification of password reset tokens
 */

/**
 * Generate secure random token
 * @returns {String} Random 64-character hex token (32 bytes = 256 bits)
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash token for secure storage in database
 * @param {String} token - Plain text token to hash
 * @returns {String} Bcrypt hash of token
 */
export const hashToken = (token) => {
  return bcrypt.hashSync(token, 10);
};

/**
 * Verify token matches stored hash
 * @param {String} plainToken - Plain text token from user
 * @param {String} tokenHash - Stored hash from database
 * @returns {Boolean} True if token matches hash
 */
export const verifyToken = (plainToken, tokenHash) => {
  return bcrypt.compareSync(plainToken, tokenHash);
};

/**
 * Get token expiration date/time
 * @param {Number} expiryHours - Hours until expiration (default: 1)
 * @returns {Date} Expiration timestamp
 */
export const getTokenExpiry = (expiryHours = 1) => {
  return new Date(Date.now() + expiryHours * 60 * 60 * 1000);
};

/**
 * Check if token is expired
 * @param {Date} expiresAt - Expiration timestamp
 * @returns {Boolean} True if expired
 */
export const isTokenExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

export default { 
  generateResetToken, 
  hashToken, 
  verifyToken, 
  getTokenExpiry,
  isTokenExpired
};
