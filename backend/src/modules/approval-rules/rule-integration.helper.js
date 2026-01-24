/**
 * Rule Evaluation Integrator
 * This module handles the integration between the ECO workflow and the rule evaluation system
 * WITHOUT breaking any existing functionality
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const RuleEvaluationService = require("./rule-evaluation.service");
const DelegationService = require("./delegation.service");

const ruleEvaluationService = new RuleEvaluationService();
const delegationService = new DelegationService();

/**
 * Evaluate and apply rules for an ECO
 * This is called during ECO start to determine which approvers should be assigned
 * 
 * Returns:
 * - dynamicApprovers: Approvers determined by rule evaluation
 * - staticApprovers: Approvers assigned directly to the stage (existing system)
 * - allApprovers: Merged list of both
 */
async function evaluateAndApplyRulesForEco(ecoId, stageId) {
  try {
    // Step 1: Evaluate rules for this ECO
    const ruleEvalResult = await ruleEvaluationService.evaluateRulesForEco(ecoId);
    const dynamicApprovers = ruleEvalResult.approvers || [];

    // Step 2: Get static approvers (from existing StageApprover table)
    const staticApproversData = await prisma.stageApprover.findMany({
      where: { stageId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const staticApprovers = staticApproversData.map(sa => ({
      userId: sa.userId,
      originalUserId: sa.userId,
      approvalCategory: sa.approvalCategory,
      isStatic: true,
      ruleName: null
    }));

    // Step 3: Merge dynamic and static approvers
    // Create a map to avoid duplicates
    const approverMap = new Map();

    // Add static approvers first
    for (const approver of staticApprovers) {
      const key = `${approver.userId}_${approver.approvalCategory}`;
      if (!approverMap.has(key)) {
        approverMap.set(key, approver);
      }
    }

    // Add dynamic approvers (rule-based), preferring them if they don't conflict
    for (const approver of dynamicApprovers) {
      const key = `${approver.userId}_${approver.approvalCategory}`;
      if (!approverMap.has(key)) {
        approverMap.set(key, { ...approver, isStatic: false });
      }
    }

    return {
      dynamicApprovers,
      staticApprovers,
      allApprovers: Array.from(approverMap.values()),
      rulesEvaluatedCount: ruleEvalResult.rulesApplied,
      rulesTriggeredCount: ruleEvalResult.rulesTriggered
    };
  } catch (error) {
    // Log error but don't fail - fall back to static approvers
    console.error("Error evaluating rules for ECO:", error);
    
    // Fallback: Return only static approvers
    const staticApproversData = await prisma.stageApprover.findMany({
      where: { stageId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return {
      dynamicApprovers: [],
      staticApprovers: staticApproversData.map(sa => ({
        userId: sa.userId,
        originalUserId: sa.userId,
        approvalCategory: sa.approvalCategory,
        isStatic: true,
        ruleName: null
      })),
      allApprovers: staticApproversData.map(sa => ({
        userId: sa.userId,
        originalUserId: sa.userId,
        approvalCategory: sa.approvalCategory,
        isStatic: true,
        ruleName: null
      })),
      error: error.message,
      rulesEvaluatedCount: 0,
      rulesTriggeredCount: 0
    };
  }
}

/**
 * Resolve actual approver with delegation consideration
 * If approver has an active delegation, return delegate; otherwise return original
 */
async function resolveApproverWithDelegation(userId) {
  try {
    const delegate = await delegationService.getActiveDelegate(userId);
    return delegate ? delegate.id : userId;
  } catch (error) {
    console.error("Error resolving approver delegation:", error);
    return userId;
  }
}

module.exports = {
  evaluateAndApplyRulesForEco,
  resolveApproverWithDelegation
};
