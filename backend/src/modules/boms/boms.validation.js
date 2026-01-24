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

export const bomListQuerySchema = {
  productId: {
    required: true,
    validator: validatePositiveInt('productId')
  }
};

export default { bomListQuerySchema };
