import { prisma } from '../../config/database.js';

export default class DelegationService {
  /**
   * CREATE: Create a new delegation
   */
  async createDelegation(input, createdById) {
    const { fromUserId, toUserId, startDate, endDate, reason } = input;

    try {
      // Validation
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const now = new Date();

      if (startDateObj < now) {
        throw new Error("Start date cannot be in the past");
      }

      if (endDateObj <= startDateObj) {
        throw new Error("End date must be after start date");
      }

      // Check if both users exist and have appropriate roles
      const [fromUser, toUser] = await Promise.all([
        prisma.user.findUnique({ where: { id: fromUserId }, include: { role: true } }),
        prisma.user.findUnique({ where: { id: toUserId }, include: { role: true } })
      ]);

      if (!fromUser || !toUser) {
        throw new Error("One or both users not found");
      }

      // Create delegation
      const delegation = await prisma.approverDelegation.create({
        data: {
          fromUserId,
          toUserId,
          startDate: startDateObj,
          endDate: endDateObj,
          reason,
          createdById,
          status: "active"
        },
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } }
        }
      });

      return delegation;
    } catch (error) {
      throw new Error(`Failed to create delegation: ${error.message}`);
    }
  }

  /**
   * READ: Get single delegation
   */
  async getDelegation(delegationId) {
    try {
      const delegation = await prisma.approverDelegation.findUnique({
        where: { id: delegationId },
        include: {
          fromUser: { select: { id: true, name: true, email: true } },
          toUser: { select: { id: true, name: true, email: true } },
          createdBy: { select: { id: true, name: true } }
        }
      });

      if (!delegation) {
        throw new Error(`Delegation ${delegationId} not found`);
      }

      return delegation;
    } catch (error) {
      throw new Error(`Failed to fetch delegation: ${error.message}`);
    }
  }

  /**
   * READ: List all delegations with filters
   */
  async listDelegations(filters = {}) {
    const { status, fromUserId, toUserId, skip = 0, take = 20 } = filters;

    try {
      const where = {};

      if (status) where.status = status;
      if (fromUserId) where.fromUserId = fromUserId;
      if (toUserId) where.toUserId = toUserId;

      const [delegations, total] = await Promise.all([
        prisma.approverDelegation.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            fromUser: { select: { name: true, email: true } },
            toUser: { select: { name: true, email: true } }
          }
        }),
        prisma.approverDelegation.count({ where })
      ]);

      return { delegations, total, page: Math.floor(skip / take) + 1, pageSize: take };
    } catch (error) {
      throw new Error(`Failed to list delegations: ${error.message}`);
    }
  }

  /**
   * READ: Get active delegations for a specific user
   * Returns both delegations FROM this user and TO this user
   */
  async getActiveDelegationsForUser(userId) {
    try {
      const now = new Date();

      const [delegationsFrom, delegationsTo] = await Promise.all([
        prisma.approverDelegation.findMany({
          where: {
            fromUserId: userId,
            status: "active",
            startDate: { lte: now },
            endDate: { gte: now }
          },
          include: {
            toUser: { select: { id: true, name: true, email: true } }
          }
        }),
        prisma.approverDelegation.findMany({
          where: {
            toUserId: userId,
            status: "active",
            startDate: { lte: now },
            endDate: { gte: now }
          },
          include: {
            fromUser: { select: { id: true, name: true, email: true } }
          }
        })
      ]);

      return { delegationsFrom, delegationsTo };
    } catch (error) {
      throw new Error(`Failed to fetch user delegations: ${error.message}`);
    }
  }

  /**
   * UPDATE: Revoke a delegation
   */
  async revokeDelegation(delegationId, revokedById) {
    try {
      const delegation = await prisma.approverDelegation.update({
        where: { id: delegationId },
        data: {
          status: "revoked"
        },
        include: {
          fromUser: { select: { name: true } },
          toUser: { select: { name: true } }
        }
      });

      return delegation;
    } catch (error) {
      throw new Error(`Failed to revoke delegation: ${error.message}`);
    }
  }

  /**
   * DELETE: Hard delete a delegation (admin only)
   */
  async deleteDelegation(delegationId) {
    try {
      const deleted = await prisma.approverDelegation.delete({
        where: { id: delegationId }
      });

      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete delegation: ${error.message}`);
    }
  }

  /**
   * MAINTENANCE: Mark expired delegations as expired
   * Should be called periodically or as a cron job
   */
  async markExpiredDelegations() {
    try {
      const now = new Date();

      const result = await prisma.approverDelegation.updateMany({
        where: {
          status: "active",
          endDate: { lt: now }
        },
        data: {
          status: "expired"
        }
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to mark expired delegations: ${error.message}`);
    }
  }

  /**
   * UTILITY: Check if user has an active delegation
   */
  async hasActiveDelegation(userId) {
    try {
      const now = new Date();

      const activeDelegation = await prisma.approverDelegation.findFirst({
        where: {
          fromUserId: userId,
          status: "active",
          startDate: { lte: now },
          endDate: { gte: now }
        }
      });

      return activeDelegation !== null;
    } catch (error) {
      throw new Error(`Failed to check delegation status: ${error.message}`);
    }
  }

  /**
   * UTILITY: Get delegate for a user (if delegation active)
   */
  async getActiveDelegate(userId) {
    try {
      const now = new Date();

      const delegation = await prisma.approverDelegation.findFirst({
        where: {
          fromUserId: userId,
          status: "active",
          startDate: { lte: now },
          endDate: { gte: now }
        },
        include: {
          toUser: { select: { id: true, name: true, email: true } }
        }
      });

      if (delegation) {
        return delegation.toUser;
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to get active delegate: ${error.message}`);
    }
  }

  /**
   * UTILITY: Get all active users delegating to a specific user
   * Used to show which approval items are delegated to the user
   */
  async getUsersDelegatingTo(userId) {
    try {
      const now = new Date();

      const delegations = await prisma.approverDelegation.findMany({
        where: {
          toUserId: userId,
          status: "active",
          startDate: { lte: now },
          endDate: { gte: now }
        },
        include: {
          fromUser: { select: { id: true, name: true, email: true } }
        }
      });

      return delegations.map(d => d.fromUser);
    } catch (error) {
      throw new Error(`Failed to get delegating users: ${error.message}`);
    }
  }
}
