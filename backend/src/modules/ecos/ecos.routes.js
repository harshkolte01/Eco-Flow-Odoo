import express from 'express';
import {
  createEcoController,
  updateEcoController,
  startEcoController,
  listEcosController,
  getEcoByIdController
} from './ecos.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createEcoSchema,
  updateEcoSchema,
  ecoIdParamSchema,
  ecoListQuerySchema
} from './ecos.validation.js';

const router = express.Router();

/**
 * @route   POST /ecos
 * @desc    Create ECO draft
 * @access  Private
 */
router.post('/', requireAuth, validate(createEcoSchema), createEcoController);

/**
 * @route   PATCH /ecos/:id
 * @desc    Update ECO draft
 * @access  Private
 */
router.patch(
  '/:id',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  validate(updateEcoSchema),
  updateEcoController
);

/**
 * @route   POST /ecos/:id/start
 * @desc    Start ECO (draft -> in_progress)
 * @access  Private
 */
router.post(
  '/:id/start',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  startEcoController
);

/**
 * @route   GET /ecos
 * @desc    List ECOs
 * @access  Private
 */
router.get('/', requireAuth, validate(ecoListQuerySchema, 'query'), listEcosController);

/**
 * @route   GET /ecos/:id
 * @desc    Get ECO by ID
 * @access  Private
 */
router.get(
  '/:id',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  getEcoByIdController
);

export default router;
