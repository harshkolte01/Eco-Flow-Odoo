/**
 * Products validation schemas
 */

const VALID_PRODUCT_STATUS = ['active', 'archived'];
const VALID_PRODUCT_QUERY_VALUES = [...VALID_PRODUCT_STATUS, 'all'];

const validateProductStatus = (value) => {
  if (typeof value !== 'string') {
    return 'status must be a string';
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return 'status must not be empty';
  }
  if (normalized === 'all') {
    return null;
  }
  const tokens = normalized
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length === 0) {
    return 'status must not be empty';
  }
  const invalidToken = tokens.find((token) => !VALID_PRODUCT_STATUS.includes(token));
  if (invalidToken) {
    return `status must be one of: ${VALID_PRODUCT_QUERY_VALUES.join(', ')}`;
  }
  return null;
};

export const productListQuerySchema = {
  status: {
    required: false,
    validator: validateProductStatus
  }
};

export default { productListQuerySchema, VALID_PRODUCT_STATUS, VALID_PRODUCT_QUERY_VALUES };
