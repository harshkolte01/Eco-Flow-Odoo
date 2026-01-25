import * as productsService from './products.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * Products Controllers
 * Handle HTTP requests for product lookup endpoints
 */

export const listProductsController = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const role = req.user?.role;
  const allStatuses = ['active', 'archived', 'draft'];

  const parseStatusQuery = (value) => {
    if (!value || typeof value !== 'string') {
      return null;
    }
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return null;
    }
    if (normalized === 'all') {
      return { statuses: allStatuses, requestedAll: true };
    }
    const tokens = normalized
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
    return { statuses: [...new Set(tokens)], requestedAll: false };
  };

  const parsed = parseStatusQuery(status);
  let statuses = parsed?.statuses ?? ['active'];

  // Operations role can only view active products
  if (role === 'operations') {
    statuses = ['active'];
  }

  const products = await productsService.getProductsByStatus(statuses);

  success(res, { products }, 200);
});

export default { listProductsController };
