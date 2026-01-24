/**
 * Products validation schemas
 */

const VALID_PRODUCT_STATUS = ['active'];

export const productListQuerySchema = {
  status: {
    required: false,
    enum: VALID_PRODUCT_STATUS
  }
};

export default { productListQuerySchema, VALID_PRODUCT_STATUS };
