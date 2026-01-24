import * as bomsService from './boms.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * BoMs Controllers
 * Handle HTTP requests for BoM lookup endpoints
 */

export const listBomsController = asyncHandler(async (req, res) => {
  const { productId } = req.query;

  const boms = await bomsService.getBomsByProduct(productId);

  success(res, { boms }, 200);
});

export default { listBomsController };
