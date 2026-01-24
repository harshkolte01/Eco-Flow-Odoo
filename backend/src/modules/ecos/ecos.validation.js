/**
 * ECO validation schemas
 */

const VALID_ECO_TYPES = ['product', 'bom'];
const VALID_ECO_SCOPES = ['all', 'mine'];

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

export const createEcoSchema = {
  title: {
    required: true
  },
  ecoType: {
    required: true,
    enum: VALID_ECO_TYPES
  },
  productId: {
    required: true,
    validator: validatePositiveInt('productId')
  },
  bomId: {
    required: false,
    validator: validatePositiveInt('bomId')
  },
  raisedById: {
    required: false,
    validator: validatePositiveInt('raisedById')
  },
  effectiveDate: {
    required: false,
    validator: validateDate('effectiveDate')
  },
  versionUpdate: {
    required: false,
    validator: validateBoolean('versionUpdate')
  }
};

export const updateEcoSchema = {
  title: {
    required: false
  },
  ecoType: {
    required: false,
    enum: VALID_ECO_TYPES
  },
  productId: {
    required: false,
    validator: validatePositiveInt('productId')
  },
  bomId: {
    required: false,
    validator: validatePositiveInt('bomId')
  },
  effectiveDate: {
    required: false,
    validator: validateDate('effectiveDate')
  },
  versionUpdate: {
    required: false,
    validator: validateBoolean('versionUpdate')
  }
};

export const ecoIdParamSchema = {
  id: {
    required: true,
    validator: validatePositiveInt('id')
  }
};

export const ecoListQuerySchema = {
  q: {
    required: false,
    maxLength: 200
  },
  ecoType: {
    required: false,
    enum: VALID_ECO_TYPES
  },
  scope: {
    required: false,
    enum: VALID_ECO_SCOPES
  }
};

export default {
  createEcoSchema,
  updateEcoSchema,
  ecoIdParamSchema,
  ecoListQuerySchema,
  VALID_ECO_TYPES,
  VALID_ECO_SCOPES
};
