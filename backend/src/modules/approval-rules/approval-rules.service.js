import { prisma } from '../../config/database.js';
import { RULE_FIELD_SET, RULE_LOGICAL_OPERATORS, RULE_OPERATOR_SET } from './rule-fields.js';

export default class ApprovalRulesService {
  normalizeFieldValue(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  normalizeConditions(conditions = []) {
    return conditions.map((condition) => ({
      ...condition,
      fieldValue: this.normalizeFieldValue(condition.fieldValue),
      logicalOperator: condition.logicalOperator ?? undefined
    }));
  }

  isEmptyConditionValue(value) {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    return false;
  }

  validateConditions(conditions = []) {
    for (const condition of conditions) {
      if (!RULE_FIELD_SET.has(condition.fieldName)) {
        throw new Error(`Unsupported condition field: ${condition.fieldName}`);
      }
      if (!RULE_OPERATOR_SET.has(condition.operator)) {
        throw new Error(`Unsupported condition operator: ${condition.operator}`);
      }
      if (condition.logicalOperator && !RULE_LOGICAL_OPERATORS.has(condition.logicalOperator)) {
        throw new Error(`Unsupported logical operator: ${condition.logicalOperator}`);
      }
      if (this.isEmptyConditionValue(condition.fieldValue)) {
        throw new Error('Condition fieldValue is required');
      }
    }
  }

  async validateStageIds(stageIds = []) {
    const normalizedStageIds = Array.from(
      new Set(
        stageIds
          .map((id) => parseInt(id, 10))
          .filter((id) => Number.isFinite(id))
      )
    );

    if (normalizedStageIds.length === 0) {
      throw new Error('At least one valid stageId is required');
    }

    const stages = await prisma.ecoStage.findMany({
      where: { id: { in: normalizedStageIds } },
      select: { id: true, approvalRequired: true }
    });

    if (stages.length !== normalizedStageIds.length) {
      throw new Error('One or more stageIds are invalid');
    }

    const invalidStages = stages.filter((stage) => !stage.approvalRequired);
    if (invalidStages.length > 0) {
      throw new Error('Approval rules can only target stages that require approval');
    }

    return normalizedStageIds;
  }

  async validateApproverUsers(approvers = []) {
    if (!approvers || approvers.length === 0) {
      return;
    }

    const approverIds = Array.from(new Set(approvers.map((approver) => approver.userId).filter(Boolean)));

    const users = await prisma.user.findMany({
      where: { id: { in: approverIds } },
      select: { id: true, role: { select: { name: true } } }
    });

    if (users.length !== approverIds.length) {
      throw new Error('One or more approver users were not found');
    }

    const invalidUsers = users.filter(
      (user) => user.role?.name !== 'approver' && user.role?.name !== 'admin'
    );

    if (invalidUsers.length > 0) {
      throw new Error('Approvers must have approver or admin roles');
    }
  }

  /**
   * CREATE: Create a new approval rule
   */
  async createRule(input, createdById) {
    const { name, description, ruleType, priority, stageIds, conditions, approvers } = input;

    try {
      this.validateConditions(conditions || []);
      const normalizedStageIds = await this.validateStageIds(stageIds || []);
      await this.validateApproverUsers(approvers || []);
      const normalizedConditions = this.normalizeConditions(conditions || []);

      const rule = await prisma.approvalRule.create({
        data: {
          name,
          description,
          ruleType,
          priority,
          stageIds: normalizedStageIds,
          createdById,
          conditions: {
            create: normalizedConditions
          },
          approvers: {
            create: approvers || []
          }
        },
        include: {
          conditions: true,
          approvers: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              },
              escalationUser: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          createdBy: { select: { id: true, name: true } }
        }
      });

      // Create audit log
      await this.createAuditLog(rule.id, "created", null, JSON.stringify(rule), createdById);

      return rule;
    } catch (error) {
      throw new Error(`Failed to create approval rule: ${error.message}`);
    }
  }

  /**
   * READ: Get single rule by ID
   */
  async getRule(ruleId) {
    try {
      const rule = await prisma.approvalRule.findUnique({
        where: { id: ruleId },
        include: {
          conditions: true,
          approvers: {
            include: {
              approver: {
                select: { id: true, name: true, email: true, role: { select: { name: true } } }
              },
              escalationUser: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy: { select: { id: true, name: true, email: true } },
          ruleAudits: { take: 10, orderBy: { performedAt: "desc" } }
        }
      });

      if (!rule) {
        throw new Error(`Rule with ID ${ruleId} not found`);
      }

      return rule;
    } catch (error) {
      throw new Error(`Failed to fetch rule: ${error.message}`);
    }
  }

  /**
   * READ: List all approval rules with filters
   */
  async listRules(filters = {}) {
    const { isActive, ruleType, stageId, skip = 0, take = 20 } = filters;

    try {
      const where = {};

      if (isActive !== undefined) where.isActive = isActive;
      if (ruleType) where.ruleType = ruleType;
      if (stageId) {
        // Filter rules that include this stageId in their stageIds array
        where.stageIds = { hasSome: [stageId] };
      }
      where.isArchived = false;

      const [rules, total] = await Promise.all([
        prisma.approvalRule.findMany({
          where,
          skip,
          take,
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
          include: {
            conditions: true,
            approvers: {
              select: {
                userId: true,
                approver: { select: { name: true, email: true } },
                approvalCategory: true
              }
            },
            createdBy: { select: { name: true } }
          }
        }),
        prisma.approvalRule.count({ where })
      ]);

      return { rules, total, page: Math.floor(skip / take) + 1, pageSize: take };
    } catch (error) {
      throw new Error(`Failed to list rules: ${error.message}`);
    }
  }

  /**
   * UPDATE: Update approval rule
   */
  async updateRule(ruleId, input, updatedById) {
    const { name, description, ruleType, priority, stageIds, isActive } = input;

    try {
      const oldRule = await this.getRule(ruleId);
      const normalizedStageIds = stageIds ? await this.validateStageIds(stageIds) : undefined;

      const updatedRule = await prisma.approvalRule.update({
        where: { id: ruleId },
        data: {
          name,
          description,
          ruleType,
          priority,
          stageIds: normalizedStageIds ?? oldRule.stageIds,
          isActive,
          updatedById,
          version: { increment: 1 }
        },
        include: {
          conditions: true,
          approvers: {
            include: {
              approver: { select: { name: true, email: true } }
            }
          }
        }
      });

      // Create audit log for update
      await this.createAuditLog(
        ruleId,
        "updated",
        JSON.stringify({ name: oldRule.name, description: oldRule.description, priority: oldRule.priority }),
        JSON.stringify({ name: updatedRule.name, description: updatedRule.description, priority: updatedRule.priority }),
        updatedById
      );

      return updatedRule;
    } catch (error) {
      throw new Error(`Failed to update rule: ${error.message}`);
    }
  }

  /**
   * DELETE: Soft delete (archive) a rule
   */
  async deleteRule(ruleId, deletedById) {
    try {
      const archivedRule = await prisma.approvalRule.update({
        where: { id: ruleId },
        data: {
          isArchived: true,
          isActive: false,
          updatedById: deletedById
        }
      });

      await this.createAuditLog(ruleId, "archived", JSON.stringify({ isActive: true }), JSON.stringify({ isActive: false }), deletedById);

      return archivedRule;
    } catch (error) {
      throw new Error(`Failed to delete rule: ${error.message}`);
    }
  }

  /**
   * CONDITIONS: Add condition to rule
   */
  async addCondition(ruleId, conditionData, userId) {
    try {
      this.validateConditions([conditionData]);
      const normalizedCondition = this.normalizeConditions([conditionData])[0];

      const condition = await prisma.ruleCondition.create({
        data: {
          ruleId,
          ...normalizedCondition
        }
      });

      await this.createAuditLog(
        ruleId,
        "condition_added",
        null,
        JSON.stringify(condition),
        userId
      );

      return condition;
    } catch (error) {
      throw new Error(`Failed to add condition: ${error.message}`);
    }
  }

  /**
   * CONDITIONS: Update condition
   */
  async updateCondition(conditionId, conditionData, userId) {
    try {
      const oldCondition = await prisma.ruleCondition.findUnique({
        where: { id: conditionId }
      });

      if (!oldCondition) {
        throw new Error('Condition not found');
      }

      const mergedCondition = {
        ...oldCondition,
        ...conditionData
      };

      this.validateConditions([mergedCondition]);
      const normalizedCondition = this.normalizeConditions([mergedCondition])[0];

      const updatedCondition = await prisma.ruleCondition.update({
        where: { id: conditionId },
        data: normalizedCondition
      });

      await this.createAuditLog(
        oldCondition.ruleId,
        "condition_updated",
        JSON.stringify(oldCondition),
        JSON.stringify(updatedCondition),
        userId
      );

      return updatedCondition;
    } catch (error) {
      throw new Error(`Failed to update condition: ${error.message}`);
    }
  }

  /**
   * CONDITIONS: Delete condition
   */
  async deleteCondition(conditionId, userId) {
    try {
      const condition = await prisma.ruleCondition.findUnique({
        where: { id: conditionId }
      });

      const deleted = await prisma.ruleCondition.delete({
        where: { id: conditionId }
      });

      await this.createAuditLog(
        condition.ruleId,
        "condition_deleted",
        JSON.stringify(condition),
        null,
        userId
      );

      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete condition: ${error.message}`);
    }
  }

  /**
   * APPROVERS: Add approver to rule
   */
  async addApprover(ruleId, approverData, userId) {
    try {
      const { userId: approverId, approvalCategory, canDelegate, escalationUserId, escalationThresholdDays } = approverData;
      await this.validateApproverUsers([{ userId: approverId }]);

      const approver = await prisma.ruleApprover.create({
        data: {
          ruleId,
          userId: approverId,
          approvalCategory,
          canDelegate,
          escalationUserId,
          escalationThresholdDays
        },
        include: {
          approver: { select: { name: true, email: true } },
          escalationUser: { select: { name: true, email: true } }
        }
      });

      await this.createAuditLog(
        ruleId,
        "approver_added",
        null,
        JSON.stringify(approver),
        userId
      );

      return approver;
    } catch (error) {
      throw new Error(`Failed to add approver: ${error.message}`);
    }
  }

  /**
   * APPROVERS: Remove approver from rule
   */
  async removeApprover(ruleId, userId, removedById) {
    try {
      const approver = await prisma.ruleApprover.findUnique({
        where: { ruleId_userId: { ruleId, userId } }
      });

      const deleted = await prisma.ruleApprover.delete({
        where: { ruleId_userId: { ruleId, userId } }
      });

      await this.createAuditLog(
        ruleId,
        "approver_removed",
        JSON.stringify(approver),
        null,
        removedById
      );

      return deleted;
    } catch (error) {
      throw new Error(`Failed to remove approver: ${error.message}`);
    }
  }

  /**
   * APPROVERS: Update approver settings (escalation, delegation, etc.)
   */
  async updateApprover(ruleId, userId, updates, updatedById) {
    try {
      const oldApprover = await prisma.ruleApprover.findUnique({
        where: { ruleId_userId: { ruleId, userId } }
      });

      const updatedApprover = await prisma.ruleApprover.update({
        where: { ruleId_userId: { ruleId, userId } },
        data: updates,
        include: {
          approver: { select: { name: true, email: true } },
          escalationUser: { select: { name: true, email: true } }
        }
      });

      await this.createAuditLog(
        ruleId,
        "approver_updated",
        JSON.stringify(oldApprover),
        JSON.stringify(updatedApprover),
        updatedById
      );

      return updatedApprover;
    } catch (error) {
      throw new Error(`Failed to update approver: ${error.message}`);
    }
  }

  /**
   * AUDIT: Get rule history (all versions)
   */
  async getRuleHistory(ruleId) {
    try {
      const audits = await prisma.ruleAudit.findMany({
        where: { ruleId },
        orderBy: { performedAt: "desc" },
        include: {
          performedBy: { select: { name: true, email: true } }
        }
      });

      return audits;
    } catch (error) {
      throw new Error(`Failed to fetch rule history: ${error.message}`);
    }
  }

  /**
   * INTERNAL: Create audit log entry
   */
  async createAuditLog(ruleId, action, oldValue, newValue, performedById) {
    try {
      await prisma.ruleAudit.create({
        data: {
          ruleId,
          action,
          oldValue,
          newValue,
          performedById
        }
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw - audit logs should not break main operations
    }
  }

  /**
   * UTILITY: Get all rules applicable to a stage
   */
  async getRulesForStage(stageId) {
    try {
      const rules = await prisma.approvalRule.findMany({
        where: {
          isActive: true,
          isArchived: false,
          stageIds: { hasSome: [stageId] }
        },
        orderBy: { priority: "asc" },
        include: {
          conditions: true,
          approvers: {
            include: {
              approver: { select: { id: true, name: true, email: true } },
              escalationUser: { select: { id: true, name: true, email: true } }
            }
          }
        }
      });

      return rules;
    } catch (error) {
      throw new Error(`Failed to fetch rules for stage: ${error.message}`);
    }
  }
}
