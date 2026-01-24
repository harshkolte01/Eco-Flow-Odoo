import express from 'express';
import {
  listStagesController,
  createStageController,
  updateStageController,
  deleteStageController,
  getStageApproversController,
  addStageApproverController,
  updateApproverCategoryController,
  removeStageApproverController
} from './stages.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  stageIdParamSchema,
  createStageSchema,
  updateStageSchema,
  addApproverSchema,
  updateApproverCategorySchema,
  approverIdParamSchema
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

/**
 * @route   GET /stages/:id/approvers
 * @desc    Get stage approvers
 * @access  Private/Admin
 */
router.get(
  '/:id/approvers',
  requireAuth,
  requireRole('admin'),
  validate(stageIdParamSchema, 'params'),
  getStageApproversController
);

/**
 * @route   POST /stages/:id/approvers
 * @desc    Add stage approver
 * @access  Private/Admin
 */
router.post(
  '/:id/approvers',
  requireAuth,
  requireRole('admin'),
  validate(stageIdParamSchema, 'params'),
  validate(addApproverSchema),
  addStageApproverController
);

/**
 * @route   PATCH /stages/:stageId/approvers/:approverId
 * @desc    Update approver category
 * @access  Private/Admin
 */
router.patch(
  '/:stageId/approvers/:approverId',
  requireAuth,
  requireRole('admin'),
  validate(stageIdParamSchema, 'params'),
  validate(approverIdParamSchema, 'params'),
  validate(updateApproverCategorySchema),
  updateApproverCategoryController
);

/**
 * @route   DELETE /stages/:stageId/approvers/:approverId
 * @desc    Remove stage approver
 * @access  Private/Admin
 */
router.delete(
  '/:stageId/approvers/:approverId',
  requireAuth,
  requireRole('admin'),
  validate(stageIdParamSchema, 'params'),
  validate(approverIdParamSchema, 'params'),
  removeStageApproverController
);

export default router;