import express from 'express';
import {
  getUsersController,
  updateUserRoleController,
  getUserLookupController
} from './users.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateRoleSchema, userIdParamSchema } from './users.validation.js';

const router = express.Router();

/**
 * @route   GET /users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 * @query   role - Filter by role name (optional)
 * @query   page - Page number (optional, default: 1)
 * @query   limit - Items per page (optional, default: 20)
 */
router.get('/', requireAuth, requireRole('admin'), getUsersController);

/**
 * @route   GET /users/lookup
 * @desc    Get lightweight users list for ECO dropdowns
 * @access  Private (engineering/approver/admin)
 */
router.get(
  '/lookup',
  requireAuth,
  requireRole('engineering', 'approver', 'admin'),
  getUserLookupController
);

/**
 * @route   PATCH /users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.patch(
  '/:id/role',
  requireAuth,
  requireRole('admin'),
  validate(userIdParamSchema, 'params'),
  validate(updateRoleSchema),
  updateUserRoleController
);

export default router;
