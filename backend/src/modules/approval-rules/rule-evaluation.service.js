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
            select: {
              productCode: true
            }
          },
          productChange: {
            include: {
              baseProductVersion: {
                select: {
                  productName: true,
                  salePrice: true,
                  costPrice: true,
                  attachments: true
                }
              }
            }
          },
          bomDraft: {
            include: {
              components: {
                select: {
                  componentProductVersionId: true,
                  quantity: true
                }
              },
              operations: {
                select: {
                  operationName: true,
                  timeMinutes: true,
                  workCenter: true
                }
              },
              baseBomVersion: {
                include: {
                  components: {
                    select: {
                      componentProductVersionId: true,
                      quantity: true
                    }
                  },
                  operations: {
                    select: {
                      operationName: true,
                      timeMinutes: true,
                      workCenter: true
                    }
                  }
                }
              }
            }
          },
          currentStage: {
            select: {
              id: true,
              approvalRequired: true
            }
          }
        }
      });

      if (!eco) {
        throw new Error(`ECO ${ecoId} not found`);
      }

      if (!eco.currentStage?.approvalRequired) {
        return {
          approvers: [],
          rulesApplied: 0,
          rulesTriggered: 0
        };
      }

      const evaluationContext = this.buildRuleContext(eco);

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
        const conditionsMet = await this.evaluateRuleConditions(rule.conditions, evaluationContext);

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

    let combinedResult = null;

    for (let i = 0; i < conditions.length; i += 1) {
      const condition = conditions[i];
      const result = await this.evaluateCondition(condition, eco);

      if (i === 0) {
        combinedResult = result;
        continue;
      }

      const operator = (condition.logicalOperator || 'AND').toUpperCase();
      if (operator === 'OR') {
        combinedResult = combinedResult || result;
      } else {
        combinedResult = combinedResult && result;
      }
    }

    return Boolean(combinedResult);
  }

  /**
   * Evaluate a single condition
   */
  async evaluateCondition(condition, eco) {
    const { fieldName, operator, fieldValue } = condition;

    // Extract value from ECO data
    const actualValue = this.extractFieldValue(fieldName, eco);

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
  extractFieldValue(fieldPath, eco) {
    const parts = fieldPath.split(".");
    let value = eco;

    for (let i = 0; i < parts.length; i += 1) {
      value = value?.[parts[i]];
    }

    return value ?? null;
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
        const items = String(expected)
          .split(",")
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
        return items.includes(actualStr);

      case "NOT_IN": // Value is NOT in list
        const notItems = String(expected)
          .split(",")
          .map(s => s.trim().toLowerCase())
          .filter(Boolean);
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

  normalizeNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  hasNumberChanged(nextValue, baseValue) {
    const normalizedNext = this.normalizeNumber(nextValue);
    const normalizedBase = this.normalizeNumber(baseValue);

    if (normalizedNext === null && normalizedBase === null) {
      return false;
    }
    if (normalizedNext === null || normalizedBase === null) {
      return true;
    }
    return normalizedNext !== normalizedBase;
  }

  hasJsonChanged(nextValue, baseValue) {
    const normalizedNext = nextValue ?? null;
    const normalizedBase = baseValue ?? null;
    return JSON.stringify(normalizedNext) !== JSON.stringify(normalizedBase);
  }

  countComponentChanges(baseComponents = [], draftComponents = []) {
    const baseMap = new Map(
      baseComponents.map((component) => [
        component.componentProductVersionId,
        this.normalizeNumber(component.quantity)
      ])
    );
    const draftMap = new Map(
      draftComponents.map((component) => [
        component.componentProductVersionId,
        this.normalizeNumber(component.quantity)
      ])
    );

    let changes = 0;

    for (const [componentId, quantity] of baseMap.entries()) {
      if (!draftMap.has(componentId)) {
        changes += 1;
        continue;
      }
      if (draftMap.get(componentId) !== quantity) {
        changes += 1;
      }
    }

    for (const componentId of draftMap.keys()) {
      if (!baseMap.has(componentId)) {
        changes += 1;
      }
    }

    return changes;
  }

  countOperationChanges(baseOperations = [], draftOperations = []) {
    const toKey = (operation) => `${operation.operationName}|${operation.workCenter ?? ''}`;
    const baseMap = new Map(
      baseOperations.map((operation) => [toKey(operation), operation.timeMinutes])
    );
    const draftMap = new Map(
      draftOperations.map((operation) => [toKey(operation), operation.timeMinutes])
    );

    let changes = 0;

    for (const [operationKey, timeMinutes] of baseMap.entries()) {
      if (!draftMap.has(operationKey)) {
        changes += 1;
        continue;
      }
      if (draftMap.get(operationKey) !== timeMinutes) {
        changes += 1;
      }
    }

    for (const operationKey of draftMap.keys()) {
      if (!baseMap.has(operationKey)) {
        changes += 1;
      }
    }

    return changes;
  }

  buildRuleContext(eco) {
    const productDraft = eco.productChange;
    const baseProduct = productDraft?.baseProductVersion;
    const bomDraft = eco.bomDraft;
    const baseBom = bomDraft?.baseBomVersion;

    const productName = productDraft?.newProductName ?? null;
    const salePrice = productDraft?.newSalePrice ?? null;
    const costPrice = productDraft?.newCostPrice ?? null;

    const nameChanged = productDraft && baseProduct
      ? productDraft.newProductName !== baseProduct.productName
      : false;
    const salePriceChanged = productDraft && baseProduct
      ? this.hasNumberChanged(productDraft.newSalePrice, baseProduct.salePrice)
      : false;
    const costPriceChanged = productDraft && baseProduct
      ? this.hasNumberChanged(productDraft.newCostPrice, baseProduct.costPrice)
      : false;
    const attachmentsChanged = productDraft && baseProduct
      ? this.hasJsonChanged(productDraft.newAttachments, baseProduct.attachments)
      : false;

    const productChangeCount = [nameChanged, salePriceChanged, costPriceChanged, attachmentsChanged]
      .filter(Boolean).length;

    const componentCount = bomDraft?.components?.length ?? null;
    const operationCount = bomDraft?.operations?.length ?? null;

    const componentChanges = bomDraft && baseBom
      ? this.countComponentChanges(baseBom.components, bomDraft.components)
      : 0;
    const operationChanges = bomDraft && baseBom
      ? this.countOperationChanges(baseBom.operations, bomDraft.operations)
      : 0;
    const bomChangeCount = componentChanges + operationChanges;

    const changesCount = eco.ecoType === 'product' ? productChangeCount : bomChangeCount;
    const hasPriceChange = eco.ecoType === 'product' ? (salePriceChanged || costPriceChanged) : false;
    const hasSpecChange = eco.ecoType === 'product'
      ? (nameChanged || attachmentsChanged)
      : bomChangeCount > 0;

    return {
      eco: {
        type: eco.ecoType,
        ecoType: eco.ecoType,
        title: eco.title
      },
      product: {
        name: productName,
        sku: eco.product?.productCode ?? null,
        code: eco.product?.productCode ?? null,
        productCode: eco.product?.productCode ?? null,
        salePrice,
        costPrice
      },
      bom: {
        componentCount,
        operationCount
      },
      changes: {
        count: changesCount,
        hasPriceChange,
        hasSpecChange
      }
    };
  }

  buildRuleContextFromMock(mockEcoData = {}) {
    const product = mockEcoData.product || {};
    const productVersion = product.version || {};
    const bom = mockEcoData.bom || {};

    return {
      eco: {
        type: mockEcoData.type ?? mockEcoData.ecoType ?? null,
        ecoType: mockEcoData.type ?? mockEcoData.ecoType ?? null,
        title: mockEcoData.title ?? null
      },
      product: {
        name: product.name ?? productVersion.productName ?? null,
        sku: product.sku ?? product.productCode ?? null,
        code: product.code ?? product.productCode ?? null,
        productCode: product.productCode ?? null,
        salePrice: product.salePrice ?? productVersion.salePrice ?? null,
        costPrice: product.costPrice ?? productVersion.costPrice ?? null
      },
      bom: {
        componentCount: bom.componentCount ?? null,
        operationCount: bom.operationCount ?? null
      },
      changes: {
        count: mockEcoData.changes?.count ?? null,
        hasPriceChange: mockEcoData.changes?.hasPriceChange ?? null,
        hasSpecChange: mockEcoData.changes?.hasSpecChange ?? null
      }
    };
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

      const context = this.buildRuleContextFromMock(mockEcoData);

      for (const condition of rule.conditions) {
        const fieldValue = this.extractFieldValue(condition.fieldName, context);
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
