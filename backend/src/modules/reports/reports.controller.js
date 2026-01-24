import * as reportsService from './reports.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * Reports Controllers
 * Handle HTTP requests for report endpoints
 */

export const getEcosReportController = asyncHandler(async (req, res) => {
  const { q, ecoType, scope } = req.query;

  const report = await reportsService.getEcosReport({
    q,
    ecoType,
    scope,
    currentUser: req.user
  });

  success(res, { report }, 200);
});

export const getProductVersionReportController = asyncHandler(async (req, res) => {
  const { productId, status, page, limit } = req.query;

  const result = await reportsService.getProductVersionHistory({
    productId,
    status,
    page,
    limit,
    currentUser: req.user
  });

  success(res, result, 200);
});

export const getBomVersionReportController = asyncHandler(async (req, res) => {
  const { bomId, productId, status, page, limit } = req.query;

  const result = await reportsService.getBomVersionHistory({
    bomId,
    productId,
    status,
    page,
    limit,
    currentUser: req.user
  });

  success(res, result, 200);
});

export const getArchivedProductsReportController = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await reportsService.getArchivedProducts({
    page,
    limit,
    currentUser: req.user
  });

  success(res, result, 200);
});

export const getActiveMatrixReportController = asyncHandler(async (req, res) => {
  const matrix = await reportsService.getActiveMatrix();

  success(res, { matrix }, 200);
});

export default {
  getEcosReportController,
  getProductVersionReportController,
  getBomVersionReportController,
  getArchivedProductsReportController,
  getActiveMatrixReportController
};
