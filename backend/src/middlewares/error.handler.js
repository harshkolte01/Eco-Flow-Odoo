import { config } from '../config/env.js';

/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent JSON responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('❌ Error:', err);
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    // Unique constraint violation
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'P2025') {
    // Record not found
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'P2003') {
    // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related record',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: config.nodeEnv === 'development' ? err.message : undefined
    });
  }

  // Handle validation errors (custom)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Validation failed',
      errors: err.errors || [],
      error: config.nodeEnv === 'development' ? err.stack : undefined
    });
  }

  // Handle custom application errors with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'An error occurred',
      error: config.nodeEnv === 'development' ? err.stack : undefined
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: config.nodeEnv === 'development' ? err.message : undefined
  });
};

export default errorHandler;
