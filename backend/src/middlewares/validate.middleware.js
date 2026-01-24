/**
 * Generic validation middleware
 * Validates request data against a schema
 */

/**
 * Custom validation error class
 */
export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate field based on rules
 */
const validateField = (field, value, rules) => {
  const errors = [];

  // Required check
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(`${field} is required`);
    return errors; // Return early if required field is missing
  }

  // Skip further validation if value is empty and not required
  if (!value || value.trim() === '') {
    return errors;
  }

  // Type validation
  if (rules.type === 'email' && !isValidEmail(value)) {
    errors.push(`${field} must be a valid email address`);
  }

  // Min length
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${field} must be at least ${rules.minLength} characters long`);
  }

  // Max length
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${field} must not exceed ${rules.maxLength} characters`);
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
  }

  // Custom validator
  if (rules.validator && typeof rules.validator === 'function') {
    const customError = rules.validator(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return errors;
};

/**
 * Validation middleware factory
 * @param {Object} schema - Validation schema { fieldName: { rules } }
 * @param {String} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware
 * 
 * @example
 * const schema = {
 *   email: { required: true, type: 'email' },
 *   password: { required: true, minLength: 8 }
 * };
 * router.post('/signup', validate(schema), handler);
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const errors = [];

    // Validate each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = validateField(field, value, rules);
      errors.push(...fieldErrors);
    }

    // If validation errors exist, throw ValidationError
    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
};

export default validate;
