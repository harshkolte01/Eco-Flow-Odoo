/**
 * Auth validation schemas
 */

export const signupSchema = {
  loginId: {
    required: true,
    minLength: 6,
    maxLength: 12,
    validator: (value) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Login ID must contain only letters, numbers, underscores, or hyphens';
      }
      return null;
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  email: {
    required: true,
    type: 'email'
  },
  password: {
    required: true,
    minLength: 8,
    validator: (value) => {
      // Password strength validation (optional)
      if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        return 'Password must contain at least one letter and one number';
      }
      return null;
    }
  }
};

export const loginSchema = {
  loginId: {
    required: true,
    minLength: 6,
    maxLength: 12,
    validator: (value) => {
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Login ID must contain only letters, numbers, underscores, or hyphens';
      }
      return null;
    }
  },
  password: {
    required: true
  }
};

export const changePasswordSchema = {
  oldPassword: {
    required: true,
    minLength: 8
  },
  newPassword: {
    required: true,
    minLength: 8,
    validator: (value) => {
      if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        return 'Password must contain at least one letter and one number';
      }
      return null;
    }
  },
  confirmPassword: {
    required: true,
    validator: (value, data) => {
      if (value !== data.newPassword) {
        return 'Passwords do not match';
      }
      return null;
    }
  }
};

export const forgotPasswordSchema = {
  email: {
    required: true,
    type: 'email'
  }
};

export const resetPasswordSchema = {
  email: {
    required: true,
    type: 'email'
  },
  token: {
    required: true,
    minLength: 1
  },
  newPassword: {
    required: true,
    minLength: 8,
    validator: (value) => {
      if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
        return 'Password must contain at least one letter and one number';
      }
      return null;
    }
  },
  confirmPassword: {
    required: true,
    validator: (value, data) => {
      if (value !== data.newPassword) {
        return 'Passwords do not match';
      }
      return null;
    }
  }
};

export default { 
  signupSchema, 
  loginSchema, 
  changePasswordSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
};
