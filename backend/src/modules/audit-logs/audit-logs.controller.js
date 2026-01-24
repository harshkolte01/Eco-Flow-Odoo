import * as auditLogsService from './audit-logs.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * Audit Logs Controllers
 * Handle HTTP requests for audit log endpoints
 */

export const listAuditLogsController = asyncHandler(async (req, res) => {
  const { entityType, entityId, performedById, page, limit, from, to } = req.query;

  const result = await auditLogsService.listAuditLogs({
    entityType,
    entityId,
    performedById,
    page,
    limit,
    from,
    to
  });

  success(res, result, 200);
});

export default {
  listAuditLogsController
};
