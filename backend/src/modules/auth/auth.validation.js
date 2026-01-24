/**
 * Auth validation schemas
 */

export const signupSchema = {
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
  email: {
    required: true,
    type: 'email'
  },
  password: {
    required: true
  }
};

export default { signupSchema, loginSchema };
