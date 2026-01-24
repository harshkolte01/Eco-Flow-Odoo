/**
 * Reports Validation Schemas
 */

const VALID_ECO_TYPES = ['product', 'bom'];
const VALID_ECO_SCOPES = ['all', 'mine'];
const VALID_PRODUCT_STATUSES = ['active', 'archived', 'draft'];
const VALID_BOM_STATUSES = ['active', 'archived', 'draft'];

const validatePositiveInt = (fieldName) => (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return `${fieldName} must be a valid positive integer`;
  }
  return null;
};

export const ecoReportQuerySchema = {
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

export const productVersionReportQuerySchema = {
  productId: {
    required: false,
    validator: validatePositiveInt('productId')
  },
  status: {
    required: false,
    enum: VALID_PRODUCT_STATUSES
  },
  page: {
    required: false,
    validator: validatePositiveInt('page')
  },
  limit: {
    required: false,
    validator: validatePositiveInt('limit')
  }
};

export const bomVersionReportQuerySchema = {
  bomId: {
    required: false,
    validator: validatePositiveInt('bomId')
  },
  productId: {
    required: false,
    validator: validatePositiveInt('productId')
  },
  status: {
    required: false,
    enum: VALID_BOM_STATUSES
  },
  page: {
    required: false,
    validator: validatePositiveInt('page')
  },
  limit: {
    required: false,
    validator: validatePositiveInt('limit')
  }
};

export const archivedProductsReportQuerySchema = {
  page: {
    required: false,
    validator: validatePositiveInt('page')
  },
  limit: {
    required: false,
    validator: validatePositiveInt('limit')
  }
};

export default {
  ecoReportQuerySchema,
  VALID_ECO_TYPES,
  VALID_ECO_SCOPES,
  VALID_PRODUCT_STATUSES,
  VALID_BOM_STATUSES,
  productVersionReportQuerySchema,
  bomVersionReportQuerySchema,
  archivedProductsReportQuerySchema
};
