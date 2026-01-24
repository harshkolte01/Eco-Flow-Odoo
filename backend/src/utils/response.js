/**
 * Standardized response helpers for consistent API responses
 */

/**
 * Success response helper
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
export const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Error response helper
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 500)
 * @param {*} error - Additional error details (only in development)
 */
export const error = (res, message, statusCode = 500, errorDetails = null) => {
  const response = {
    success: false,
    message
  };

  // Include error details only in development
  if (process.env.NODE_ENV === 'development' && errorDetails) {
    response.error = errorDetails;
  }

  return res.status(statusCode).json(response);
};

export default { success, error };
