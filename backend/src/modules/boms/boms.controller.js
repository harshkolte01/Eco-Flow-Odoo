import * as bomsService from './boms.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * BoMs Controllers
 * Handle HTTP requests for BoM lookup endpoints
 */

export const listBomsController = asyncHandler(async (req, res) => {
  const { productId, status, q } = req.query;

  let boms = [];

  if (productId) {
    boms = await bomsService.getBomsByProduct(productId);
  } else {
    const role = req.user?.role;
    const effectiveStatus = role === 'operations' ? 'active' : status;
    boms = await bomsService.listBomOverview({ status: effectiveStatus, q });
  }

  success(res, { boms }, 200);
});

export default { listBomsController };
