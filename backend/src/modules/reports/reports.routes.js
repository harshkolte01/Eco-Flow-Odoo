import express from 'express';
import {
  getEcosReportController,
  getProductVersionReportController,
  getBomVersionReportController,
  getArchivedProductsReportController,
  getActiveMatrixReportController
} from './reports.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  ecoReportQuerySchema,
  productVersionReportQuerySchema,
  bomVersionReportQuerySchema,
  archivedProductsReportQuerySchema
} from './reports.validation.js';

const router = express.Router();

/**
 * @route   GET /reports/ecos
 * @desc    Get ECOs report data
 * @access  Private
 */
router.get(
  '/ecos',
  requireAuth,
  validate(ecoReportQuerySchema, 'query'),
  getEcosReportController
);

/**
 * @route   GET /reports/product-versions
 * @desc    Get product version history report
 * @access  Private
 */
router.get(
  '/product-versions',
  requireAuth,
  validate(productVersionReportQuerySchema, 'query'),
  getProductVersionReportController
);

/**
 * @route   GET /reports/bom-versions
 * @desc    Get BoM version history report
 * @access  Private
 */
router.get(
  '/bom-versions',
  requireAuth,
  validate(bomVersionReportQuerySchema, 'query'),
  getBomVersionReportController
);

/**
 * @route   GET /reports/archived-products
 * @desc    Get archived products report
 * @access  Private
 */
router.get(
  '/archived-products',
  requireAuth,
  validate(archivedProductsReportQuerySchema, 'query'),
  getArchivedProductsReportController
);

/**
 * @route   GET /reports/active-matrix
 * @desc    Get active product-version-bom matrix report
 * @access  Private
 */
router.get('/active-matrix', requireAuth, getActiveMatrixReportController);

export default router;
