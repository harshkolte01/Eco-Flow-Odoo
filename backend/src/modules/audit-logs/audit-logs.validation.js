/**
 * Audit logs validation schemas
 */

const VALID_ENTITY_TYPES = ['product', 'bom', 'eco'];

const validatePositiveInt = (fieldName) => (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return `${fieldName} must be a valid positive integer`;
  }
  return null;
};

const validateDate = (fieldName) => (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  return null;
};

export const auditLogQuerySchema = {
  entityType: {
    required: false,
    enum: VALID_ENTITY_TYPES
  },
  entityId: {
    required: false,
    maxLength: 200
  },
  performedById: {
    required: false,
    validator: validatePositiveInt('performedById')
  },
  page: {
    required: false,
    validator: validatePositiveInt('page')
  },
  limit: {
    required: false,
    validator: validatePositiveInt('limit')
  },
  from: {
    required: false,
    validator: validateDate('from')
  },
  to: {
    required: false,
    validator: validateDate('to')
  }
};

export default {
  auditLogQuerySchema,
  VALID_ENTITY_TYPES
};
