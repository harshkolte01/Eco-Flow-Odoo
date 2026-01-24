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

const validateApprovalCategory = (value) => {
  if (!['required', 'optional'].includes(value)) {
    return 'approvalCategory must be either "required" or "optional"';
  }
  return null;
};

export const addApproverSchema = {
  userId: {
    required: true,
    validator: validatePositiveInt('userId')
  },
  approvalCategory: {
    required: false,
    validator: validateApprovalCategory
  }
};

export const updateApproverCategorySchema = {
  approvalCategory: {
    required: true,
    validator: validateApprovalCategory
  }
};

export const approverIdParamSchema = {
  approverId: {
    required: true,
    validator: validatePositiveInt('approverId')
  }
};

export default {
  stageIdParamSchema,
  createStageSchema,
  updateStageSchema,
  addApproverSchema,
  updateApproverCategorySchema,
  approverIdParamSchema
};
