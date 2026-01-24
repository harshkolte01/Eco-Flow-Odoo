import { prisma } from '../../config/database.js';

export default class RuleEvaluationService {
  /**
   * Main entry point: Evaluate all applicable rules for an ECO
   * Returns list of approvers that should be assigned based on rules
   */
  async evaluateRulesForEco(ecoId) {
    try {
      // Fetch ECO with all necessary data for evaluation
      const eco = await prisma.eco.findUnique({
        where: { id: ecoId },
        include: {
          product: {
            include: {
              versions: {
                where: { status: "active" },
                take: 1
              }
            }
          },
          bom: {
            include: {
              versions: {
                where: { status: "active" },
                take: 1
              }
            }
          },
          currentStage: true
        }
      });

      if (!eco) {
        throw new Error(`ECO ${ecoId} not found`);
      }

      // Get all active rules for this stage
      const applicableRules = await prisma.approvalRule.findMany({
        where: {
          isActive: true,
          isArchived: false,
          stageIds: { hasSome: [eco.currentStageId] }
        },
        orderBy: { priority: "asc" },
        include: {
          conditions: true,
          approvers: {
            include: {
              approver: true,
              escalationUser: true
            }
          }
        }
      });

      // Evaluate each rule
      const evaluatedApprovers = new Map(); // userId -> approverData
      const evaluationLogs = [];

      for (const rule of applicableRules) {
        // Check if rule conditions are met
        const conditionsMet = await this.evaluateRuleConditions(rule.conditions, eco);

        // Log the evaluation
        evaluationLogs.push({
          ecoId,
          ruleId: rule.id,
          conditionsMet,
          evaluatedApprovers: JSON.stringify([]) // Will update below if conditions met
        });

        if (conditionsMet) {
          // If conditions met, add approvers from this rule
          for (const approver of rule.approvers) {
            const key = `${approver.userId}_${approver.approvalCategory}`;

            // Check for active delegations
            const actualApproverId = await this.resolveApproverWithDelegation(approver.userId);

            evaluatedApprovers.set(key, {
              userId: actualApproverId,
              originalUserId: approver.userId,
              approvalCategory: approver.approvalCategory,
              ruleId: rule.id,
              ruleName: rule.name,
              canDelegate: approver.canDelegate,
              escalationUserId: approver.escalationUserId,
              escalationThresholdDays: approver.escalationThresholdDays
            });
          }

          // Update evaluation log with approvers
          evaluationLogs[evaluationLogs.length - 1].evaluatedApprovers = JSON.stringify(
            Array.from(evaluatedApprovers.values())
          );
        }
      }

      // Store evaluation logs in database
      await this.logEvaluations(evaluationLogs);

      // Return final list of approvers
      return {
        approvers: Array.from(evaluatedApprovers.values()),
        rulesApplied: applicableRules.length,
        rulesTriggered: evaluationLogs.filter(l => l.conditionsMet).length
      };
    } catch (error) {
      throw new Error(`Failed to evaluate rules for ECO: ${error.message}`);
    }
  }

  /**
   * Evaluate all conditions for a rule
   * Returns true if all conditions are met (AND logic)
   */
  async evaluateRuleConditions(conditions, eco) {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions = always applies
    }

    // Get the product version
    const productVersion = eco.product.versions?.[0];

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, eco, productVersion);

      // If any condition fails (AND logic), entire rule fails
      if (!result) {
        return false;
      }
    }

    return true; // All conditions passed
  }

  /**
   * Evaluate a single condition
   */
  async evaluateCondition(condition, eco, productVersion) {
    const { fieldName, operator, fieldValue } = condition;

    // Extract value from ECO data
    let actualValue = this.extractFieldValue(fieldName, eco, productVersion);

    if (actualValue === null || actualValue === undefined) {
      return false; // Field not found = condition fails
    }

    // Compare based on operator
    return this.compareValues(actualValue, operator, fieldValue);
  }

  /**
   * Extract field value from ECO data using dot notation
   * Examples: "product.salePrice", "eco.type", "product.category"
   */
  extractFieldValue(fieldPath, eco, productVersion) {
    const parts = fieldPath.split(".");

    if (parts[0] === "eco") {
      // Navigate through ECO object
      let value = eco;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    } else if (parts[0] === "product") {
      // Navigate through product/productVersion
      if (parts[1] === "version") {
        // product.version.salePrice
        let value = productVersion;
        for (let i = 2; i < parts.length; i++) {
          value = value?.[parts[i]];
        }
        return value;
      } else {
        // product.salePrice (use active version)
        let value = productVersion;
        for (let i = 1; i < parts.length; i++) {
          value = value?.[parts[i]];
        }
        return value;
      }
    } else if (parts[0] === "bom") {
      // Navigate through BOM
      let value = eco.bom;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }

    return null;
  }

  /**
   * Compare actual value with expected value using operator
   */
  compareValues(actual, operator, expected) {
    // Convert to appropriate types
    const actualNum = parseFloat(actual);
    const expectedNum = parseFloat(expected);
    const actualStr = String(actual).toLowerCase();
    const expectedStr = String(expected).toLowerCase();

    switch (operator) {
      case "GT": // Greater than
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum > expectedNum;

      case "LT": // Less than
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum < expectedNum;

      case "GTE": // Greater than or equal
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum >= expectedNum;

      case "LTE": // Less than or equal
        return !isNaN(actualNum) && !isNaN(expectedNum) && actualNum <= expectedNum;

      case "EQ": // Equals
        return actualStr === expectedStr;

      case "IN": // Value is in list (comma-separated)
        const items = expected.split(",").map(s => s.trim().toLowerCase());
        return items.includes(actualStr);

      case "NOT_IN": // Value is NOT in list
        const notItems = expected.split(",").map(s => s.trim().toLowerCase());
        return !notItems.includes(actualStr);

      case "CONTAINS": // String contains
        return actualStr.includes(expectedStr);

      case "NOT_CONTAINS": // String does NOT contain
        return !actualStr.includes(expectedStr);

      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Check if approver has an active delegation
   * If yes, return the delegate's ID; otherwise return original ID
   */
  async resolveApproverWithDelegation(userId) {
    const now = new Date();

    const activeDelegation = await prisma.approverDelegation.findFirst({
      where: {
        fromUserId: userId,
        status: "active",
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    if (activeDelegation) {
      return activeDelegation.toUserId; // Return delegate
    }

    return userId; // Return original approver
  }

  /**
   * Log rule evaluations to database for audit trail
   */
  async logEvaluations(logs) {
    try {
      for (const log of logs) {
        await prisma.ruleEvaluationLog.create({
          data: {
            ecoId: log.ecoId,
            ruleId: log.ruleId,
            conditionsMet: log.conditionsMet,
            evaluatedApprovers: log.evaluatedApprovers
          }
        });
      }
    } catch (error) {
      console.error("Failed to log rule evaluations:", error);
      // Don't throw - evaluation logs should not break main operations
    }
  }

  /**
   * Simulate rule evaluation with mock ECO data
   * Used for testing rules before activation
   */
  async simulateRuleEvaluation(ruleId, mockEcoData) {
    try {
      const rule = await prisma.approvalRule.findUnique({
        where: { id: ruleId },
        include: {
          conditions: true,
          approvers: {
            include: {
              approver: { select: { id: true, name: true, email: true } }
            }
          }
        }
      });

      if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
      }

      // Evaluate conditions against mock data
      const conditionResults = [];
      let allConditionsMet = true;

      for (const condition of rule.conditions) {
        const fieldValue = this.extractFieldValue(condition.fieldName, mockEcoData, mockEcoData.product?.version);
        const conditionMet = this.compareValues(fieldValue, condition.operator, condition.fieldValue);

        conditionResults.push({
          condition: `${condition.fieldName} ${condition.operator} ${condition.fieldValue}`,
          actualValue: fieldValue,
          result: conditionMet
        });

        if (!conditionMet) {
          allConditionsMet = false;
        }
      }

      // Return simulation results
      return {
        ruleId,
        ruleName: rule.name,
        allConditionsMet,
        conditions: conditionResults,
        approversIfTriggered: rule.approvers.map(a => ({
          userId: a.userId,
          name: a.approver.name,
          email: a.approver.email,
          category: a.approvalCategory
        }))
      };
    } catch (error) {
      throw new Error(`Failed to simulate rule evaluation: ${error.message}`);
    }
  }

  /**
   * Get evaluation logs for an ECO (for analytics)
   */
  async getEcoRuleEvaluations(ecoId) {
    try {
      const logs = await prisma.ruleEvaluationLog.findMany({
        where: { ecoId },
        include: {
          rule: { select: { id: true, name: true } }
        },
        orderBy: { evaluatedAt: "desc" }
      });

      return logs;
    } catch (error) {
      throw new Error(`Failed to fetch evaluation logs: ${error.message}`);
    }
  }
}
