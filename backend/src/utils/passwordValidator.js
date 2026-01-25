/**
 * Password Validation Utility
 * Validates password strength and requirements
 */

/**
 * Validate password meets security requirements
 * @param {String} password - Password to validate
 * @returns {Object} { isValid: boolean, errors: string[], hasSpecial: boolean }
 */
export const validatePassword = (password) => {
  const errors = [];
  
  // Length check
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  // Must contain letter
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  // Must contain number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special characters (optional but encouraged)
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return {
    isValid: errors.length === 0,
    errors,
    hasSpecial
  };
};

/**
 * Generate password strength score
 * @param {String} password - Password to check
 * @returns {Object} { score: number, strength: string }
 */
export const getPasswordStrength = (password) => {
  let score = 0;
  
  if (!password) {
    return { score: 0, strength: 'Very Weak' };
  }
  
  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // Determine strength
  let strength = 'Very Weak';
  if (score >= 7) strength = 'Very Strong';
  else if (score >= 5) strength = 'Strong';
  else if (score >= 4) strength = 'Medium';
  else if (score >= 2) strength = 'Weak';
  
  return { score, strength };
};

export default { validatePassword, getPasswordStrength };
