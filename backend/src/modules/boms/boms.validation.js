/**
 * BoMs validation schemas
 */

const validatePositiveInt = (fieldName) => (value) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return `${fieldName} must be a valid positive integer`;
  }
  return null;
};

const VALID_BOM_STATUSES = ['active', 'archived'];

const validateStatusList = (value) => {
  if (typeof value !== 'string') {
    return 'status must be a comma-separated string';
  }
  const statuses = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (statuses.length === 0) {
    return 'status must include at least one value';
  }
  const invalid = statuses.filter((status) => !VALID_BOM_STATUSES.includes(status));
  if (invalid.length > 0) {
    return `status must be one of: ${VALID_BOM_STATUSES.join(', ')}`;
  }
  return null;
};

export const bomListQuerySchema = {
  productId: {
    required: false,
    validator: validatePositiveInt('productId')
  },
  status: {
    required: false,
    validator: validateStatusList
  },
  q: {
    required: false
  }
};

export default { bomListQuerySchema, VALID_BOM_STATUSES };
