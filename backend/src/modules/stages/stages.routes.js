import express from 'express';
import {
  listStagesController,
  createStageController,
  updateStageController,
  deleteStageController
} from './stages.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  stageIdParamSchema,
  createStageSchema,
  updateStageSchema
} from './stages.validation.js';

const router = express.Router();

/**
 * @route   GET /stages
 * @desc    List ECO stages
 * @access  Private
 */
router.get('/', requireAuth, requireRole('admin'), listStagesController);

/**
 * @route   POST /stages
 * @desc    Create ECO stage
 * @access  Private/Admin
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validate(createStageSchema),
  createStageController
);

/**
 * @route   PATCH /stages/:id
 * @desc    Update ECO stage
 * @access  Private/Admin
 */
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(stageIdParamSchema, 'params'),
  validate(updateStageSchema),
  updateStageController
);

/**
 * @route   DELETE /stages/:id
 * @desc    Delete ECO stage
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validate(stageIdParamSchema, 'params'),
  deleteStageController
);

export default router;
