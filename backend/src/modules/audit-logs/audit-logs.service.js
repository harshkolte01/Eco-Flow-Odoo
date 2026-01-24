import { prisma } from '../../config/database.js';

/**
 * Audit Logs Service
 * Business logic for retrieving audit log entries
 */

const parseOptionalDate = (value, fieldName) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const error = new Error(`${fieldName} must be a valid date`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

export const listAuditLogs = async ({
  entityType,
  entityId,
  performedById,
  page = 1,
  limit = 20,
  from,
  to
}) => {
  const take = Math.min(parseInt(limit, 10) || 20, 100);
  const currentPage = parseInt(page, 10) || 1;
  const skip = (currentPage - 1) * take;

  const where = {};

  if (entityType) {
    where.entityType = entityType;
  }

  if (entityId) {
    where.entityId = String(entityId).trim();
  }

  if (performedById) {
    where.performedById = parseInt(performedById, 10);
  }

  const fromDate = parseOptionalDate(from, 'from');
  const toDate = parseOptionalDate(to, 'to');

  if (fromDate || toDate) {
    where.timestamp = {};
    if (fromDate) {
      where.timestamp.gte = fromDate;
    }
    if (toDate) {
      where.timestamp.lte = toDate;
    }
  }

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      skip,
      take,
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            loginId: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      oldValue: log.oldValue,
      newValue: log.newValue,
      timestamp: log.timestamp,
      performedBy: {
        id: log.performedBy.id,
        name: log.performedBy.name,
        loginId: log.performedBy.loginId,
        email: log.performedBy.email,
        role: log.performedBy.role?.name ?? null
      }
    })),
    pagination: {
      page: currentPage,
      limit: take,
      total
    }
  };
};

export default {
  listAuditLogs
};
