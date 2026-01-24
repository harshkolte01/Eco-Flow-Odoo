/**
 * Users validation schemas
 */

const VALID_ROLES = ['engineering', 'approver', 'operations', 'admin'];

export const updateRoleSchema = {
  roleName: {
    required: true,
    enum: VALID_ROLES,
    validator: (value) => {
      if (!VALID_ROLES.includes(value)) {
        return `Role must be one of: ${VALID_ROLES.join(', ')}`;
      }
      return null;
    }
  }
};

// Validation for userId param
export const userIdParamSchema = {
  id: {
    required: true,
    validator: (value) => {
      const id = parseInt(value, 10);
      if (isNaN(id) || id <= 0) {
        return 'User ID must be a valid positive integer';
      }
      return null;
    }
  }
};

export default { updateRoleSchema, userIdParamSchema, VALID_ROLES };
