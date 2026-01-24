import express from 'express';
import { listAuditLogsController } from './audit-logs.controller.js';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { auditLogQuerySchema } from './audit-logs.validation.js';

const router = express.Router();

/**
 * @route   GET /audit-logs
 * @desc    List audit logs
 * @access  Private (Approver/Admin)
 */
router.get(
  '/',
  requireAuth,
  requireRole('approver', 'admin'),
  validate(auditLogQuerySchema, 'query'),
  listAuditLogsController
);

export default router;
