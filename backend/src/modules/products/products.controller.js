import * as productsService from './products.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * Products Controllers
 * Handle HTTP requests for product lookup endpoints
 */

export const listProductsController = asyncHandler(async (req, res) => {
  const { status } = req.query;

  if (status && status !== 'active') {
    const error = new Error('Only active products are supported');
    error.statusCode = 400;
    throw error;
  }

  const products = await productsService.getActiveProducts();

  success(res, { products }, 200);
});

export default { listProductsController };
