import express from 'express';
import { listBomsController } from './boms.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { bomListQuerySchema } from './boms.validation.js';

const router = express.Router();

/**
 * @route   GET /boms
 * @desc    List active BoMs for a product
 * @access  Private
 */
router.get('/', requireAuth, validate(bomListQuerySchema, 'query'), listBomsController);

export default router;
