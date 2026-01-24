import { prisma } from '../../config/database.js';

class ApproversService {
  /**
   * Get all approvers for a specific stage
   */
  async getStageApprovers(stageId) {
    const approvers = await prisma.stageApprover.findMany({
      where: { stageId: parseInt(stageId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            sequenceOrder: true
          }
        }
      },
      orderBy: [
        { approvalCategory: 'asc' }, // required first
        { user: { name: 'asc' } }
      ]
    });

    return approvers;
  }

  /**
   * Add an approver to a stage
   */
  async addStageApprover(stageId, userId, approvalCategory = 'required') {
    // Validate stage exists
    const stage = await prisma.ecoStage.findUnique({
      where: { id: parseInt(stageId) }
    });

    if (!stage) {
      throw new Error('Stage not found');
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if approver already exists
    const existing = await prisma.stageApprover.findUnique({
      where: {
        stageId_userId: {
          stageId: parseInt(stageId),
          userId: parseInt(userId)
        }
      }
    });

    if (existing) {
      throw new Error('User is already an approver for this stage');
    }

    // Create stage approver
    const stageApprover = await prisma.stageApprover.create({
      data: {
        stageId: parseInt(stageId),
        userId: parseInt(userId),
        approvalCategory
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true,
            role: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return stageApprover;
  }

  /**
   * Update approver's category (required/optional)
   */
  async updateApproverCategory(approverId, approvalCategory) {
    const approver = await prisma.stageApprover.findUnique({
      where: { id: parseInt(approverId) }
    });

    if (!approver) {
      throw new Error('Stage approver not found');
    }

    const updated = await prisma.stageApprover.update({
      where: { id: parseInt(approverId) },
      data: { approvalCategory },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true
          }
        }
      }
    });

    return updated;
  }

  /**
   * Remove an approver from a stage
   */
  async removeStageApprover(approverId) {
    const approver = await prisma.stageApprover.findUnique({
      where: { id: parseInt(approverId) }
    });

    if (!approver) {
      throw new Error('Stage approver not found');
    }

    await prisma.stageApprover.delete({
      where: { id: parseInt(approverId) }
    });

    return { success: true, message: 'Approver removed successfully' };
  }

  /**
   * Check if ECO can proceed to next stage based on approval requirements
   */
  async canProceedToNextStage(ecoId, stageId) {
    // Get all required approvers for this stage
    const requiredApprovers = await prisma.stageApprover.findMany({
      where: {
        stageId: parseInt(stageId),
        approvalCategory: 'required'
      },
      select: {
        userId: true
      }
    });

    // If no required approvers, can proceed
    if (requiredApprovers.length === 0) {
      return {
        canProceed: true,
        reason: 'no_required_approvals',
        missingApprovals: []
      };
    }

    // Check if all required approvers have approved
    const approvals = await prisma.ecoApproval.findMany({
      where: {
        ecoId: parseInt(ecoId),
        stageId: parseInt(stageId),
        status: 'approved'
      },
      select: {
        approverId: true
      }
    });

    const approvedUserIds = new Set(approvals.map(a => a.approverId));
    const missingApprovals = requiredApprovers.filter(
      ra => !approvedUserIds.has(ra.userId)
    );

    if (missingApprovals.length > 0) {
      // Get user details for missing approvals
      const missingApprovers = await prisma.user.findMany({
        where: {
          id: {
            in: missingApprovals.map(ma => ma.userId)
          }
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      return {
        canProceed: false,
        reason: 'pending_required_approvals',
        missingApprovals: missingApprovers
      };
    }

    return {
      canProceed: true,
      reason: 'all_approved',
      missingApprovals: []
    };
  }

  /**
   * Get approval summary for an ECO at a specific stage
   */
  async getApprovalSummary(ecoId, stageId) {
    const [stageApprovers, ecoApprovals] = await Promise.all([
      prisma.stageApprover.findMany({
        where: { stageId: parseInt(stageId) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.ecoApproval.findMany({
        where: {
          ecoId: parseInt(ecoId),
          stageId: parseInt(stageId)
        },
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    ]);

    const approvalMap = new Map(
      ecoApprovals.map(a => [a.approverId, a])
    );

    const summary = stageApprovers.map(sa => ({
      approverId: sa.userId,
      approverName: sa.user.name,
      approverEmail: sa.user.email,
      category: sa.approvalCategory,
      status: approvalMap.has(sa.userId) ? approvalMap.get(sa.userId).status : 'pending',
      actionDate: approvalMap.has(sa.userId) ? approvalMap.get(sa.userId).actionDate : null
    }));

    const requiredCount = summary.filter(s => s.category === 'required').length;
    const requiredApproved = summary.filter(
      s => s.category === 'required' && s.status === 'approved'
    ).length;
    const optionalCount = summary.filter(s => s.category === 'optional').length;
    const optionalApproved = summary.filter(
      s => s.category === 'optional' && s.status === 'approved'
    ).length;

    return {
      approvers: summary,
      stats: {
        requiredCount,
        requiredApproved,
        optionalCount,
        optionalApproved,
        canProceed: requiredCount === 0 || requiredApproved === requiredCount
      }
    };
  }

  /**
   * Get all approvers across all stages (for admin view)
   */
  async getAllStageApprovers() {
    const approvers = await prisma.stageApprover.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            loginId: true
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            sequenceOrder: true
          }
        }
      },
      orderBy: [
        { stage: { sequenceOrder: 'asc' } },
        { approvalCategory: 'asc' },
        { user: { name: 'asc' } }
      ]
    });

    return approvers;
  }
}

export default new ApproversService();
