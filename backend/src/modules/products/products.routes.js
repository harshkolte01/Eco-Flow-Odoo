import express from 'express';
import { listProductsController } from './products.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { productListQuerySchema } from './products.validation.js';

const router = express.Router();

/**
 * @route   GET /products
 * @desc    List active products for ECO dropdown
 * @access  Private
 */
router.get('/', requireAuth, validate(productListQuerySchema, 'query'), listProductsController);

export default router;
