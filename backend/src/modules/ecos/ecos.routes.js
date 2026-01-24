import express from 'express';
import {
  createEcoController,
  updateEcoController,
  startEcoController,
  listEcosController,
  getEcoByIdController,
  getEcoProductDraftController,
  updateEcoProductDraftController,
  getEcoBomDraftController,
  updateEcoBomDraftController
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
 * @route   GET /ecos/:id/draft/product
 * @desc    Get ECO product draft changes
 * @access  Private
 */
router.get(
  '/:id/draft/product',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  getEcoProductDraftController
);

/**
 * @route   PUT /ecos/:id/draft/product
 * @desc    Update ECO product draft changes
 * @access  Private
 */
router.put(
  '/:id/draft/product',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  updateEcoProductDraftController
);

/**
 * @route   GET /ecos/:id/draft/bom
 * @desc    Get ECO BoM draft changes
 * @access  Private
 */
router.get(
  '/:id/draft/bom',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  getEcoBomDraftController
);

/**
 * @route   PUT /ecos/:id/draft/bom
 * @desc    Update ECO BoM draft changes
 * @access  Private
 */
router.put(
  '/:id/draft/bom',
  requireAuth,
  validate(ecoIdParamSchema, 'params'),
  updateEcoBomDraftController
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
