import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export const requireAuth = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Role-based Authorization Middleware
 * Checks if user's role is in the allowed roles
 * 
 * @param  {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.get('/admin-only', requireAuth, requireRole('admin'), handler);
 * router.post('/approvers', requireAuth, requireRole('admin', 'approver'), handler);
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

export default { requireAuth, requireRole };
