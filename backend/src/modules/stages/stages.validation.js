/**
 * ECO stages validation schemas
 */

const validatePositiveInt = (fieldName) => (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return `${fieldName} must be a valid positive integer`;
  }
  return null;
};

const validateBoolean = (fieldName) => (value) => {
  if (typeof value !== 'boolean') {
    return `${fieldName} must be a boolean`;
  }
  return null;
};

export const stageIdParamSchema = {
  id: {
    required: true,
    validator: validatePositiveInt('id')
  }
};

export const createStageSchema = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 80
  },
  sequenceOrder: {
    required: true,
    validator: validatePositiveInt('sequenceOrder')
  },
  approvalRequired: {
    required: true,
    validator: validateBoolean('approvalRequired')
  }
};

export const updateStageSchema = {
  name: {
    required: false,
    minLength: 2,
    maxLength: 80
  },
  sequenceOrder: {
    required: false,
    validator: validatePositiveInt('sequenceOrder')
  },
  approvalRequired: {
    required: false,
    validator: validateBoolean('approvalRequired')
  }
};

export default {
  stageIdParamSchema,
  createStageSchema,
  updateStageSchema
};
