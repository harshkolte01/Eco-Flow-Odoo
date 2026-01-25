/**
 * Rule Evaluation Integrator
 * This module handles the integration between the ECO workflow and the rule evaluation system
 * WITHOUT breaking any existing functionality
 */

import { prisma } from '../../config/database.js';
import RuleEvaluationService from './rule-evaluation.service.js';
import DelegationService from './delegation.service.js';
import approversService from '../stages/approvers.service.js';

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
export async function evaluateAndApplyRulesForEco(ecoId, stageId) {
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
export async function resolveApproverWithDelegation(userId) {
  try {
    const delegate = await delegationService.getActiveDelegate(userId);
    return delegate ? delegate.id : userId;
  } catch (error) {
    console.error("Error resolving approver delegation:", error);
    return userId;
  }
}

/**
 * Check if all required approvals for an ECO stage are complete
 * This merges both static approvers (StageApprover) and dynamic approvers (from rules)
 * 
 * Returns:
 * - canProceed: boolean - whether ECO can move to next stage
 * - reason: string - explanation if cannot proceed
 * - missingApprovals: array - list of pending approvals
 */
export async function canProceedWithApprovals(ecoId, stageId) {
  try {
    // First check static approvers (existing system)
    const staticCheck = await approversService.canProceedToNextStage(ecoId, stageId);
    
    // If static approvers haven't all approved, can't proceed
    if (!staticCheck.canProceed) {
      return staticCheck;
    }
    
    const persistedAssignments = await prisma.ecoApproverAssignment.findMany({
      where: { ecoId, stageId }
    });

    let dynamicApprovers = persistedAssignments;

    if (dynamicApprovers.length === 0) {
      const ruleEvalResult = await evaluateAndApplyRulesForEco(ecoId, stageId);
      dynamicApprovers = ruleEvalResult.dynamicApprovers || [];
    }
    
    // If no dynamic approvers, static check is sufficient
    if (dynamicApprovers.length === 0) {
      return staticCheck;
    }
    
    // Check if all required dynamic approvers have approved
    const requiredDynamicApprovers = dynamicApprovers.filter(
      a => a.approvalCategory === 'required'
    );
    
    if (requiredDynamicApprovers.length === 0) {
      return staticCheck; // No required dynamic approvers
    }
    
    // Get all approvals for this ECO at this stage
    const approvals = await prisma.ecoApproval.findMany({
      where: {
        ecoId,
        stageId,
        status: 'approved'
      },
      select: {
        approverId: true
      }
    });
    
    const approvedUserIds = new Set(approvals.map(a => a.approverId));
    
    // Check which required dynamic approvers haven't approved yet
    const missingDynamicApprovals = [];
    for (const approver of requiredDynamicApprovers) {
      if (!approvedUserIds.has(approver.userId)) {
        missingDynamicApprovals.push({
          userId: approver.userId,
          category: approver.approvalCategory,
          ruleName: approver.ruleName ?? null
        });
      }
    }
    
    if (missingDynamicApprovals.length > 0) {
      return {
        canProceed: false,
        reason: `Waiting for ${missingDynamicApprovals.length} rule-based approval(s)`,
        missingApprovals: missingDynamicApprovals,
        staticComplete: true,
        dynamicComplete: false
      };
    }
    
    // All approvals complete (both static and dynamic)
    return {
      canProceed: true,
      reason: 'All required approvals received',
      missingApprovals: [],
      staticComplete: true,
      dynamicComplete: true
    };
    
  } catch (error) {
    console.error('Error checking approvals with rules:', error);
    // Fallback to static approvers only (safe degradation)
    return approversService.canProceedToNextStage(ecoId, stageId);
  }
}

/**
 * Assign approvers to an ECO based on rule evaluation
 * This is called after ECO moves to a new stage to set up required approvers
 * NOTE: This is informational only - actual approval tracking uses EcoApproval table
 */
export async function assignApproversFromRules(ecoId) {
  try {
    const eco = await prisma.eco.findUnique({
      where: { id: ecoId },
      select: {
        currentStageId: true,
        currentStage: { select: { approvalRequired: true } }
      }
    });
    
    if (!eco || !eco.currentStageId) {
      console.warn(`Cannot assign approvers: ECO ${ecoId} has no current stage`);
      return { success: false, reason: 'No current stage' };
    }

    if (!eco.currentStage?.approvalRequired) {
      return { success: true, approvers: [], skipped: true, reason: 'Stage does not require approval' };
    }

    const existingAssignments = await prisma.ecoApproverAssignment.findMany({
      where: { ecoId, stageId: eco.currentStageId }
    });

    if (existingAssignments.length > 0) {
      return {
        success: true,
        approvers: existingAssignments,
        persisted: true,
        stats: {
          rulesEvaluated: 0,
          rulesTriggered: 0,
          dynamicCount: existingAssignments.length,
          staticCount: 0
        }
      };
    }
    
    // Evaluate rules for the current stage
    const result = await evaluateAndApplyRulesForEco(ecoId, eco.currentStageId);

    if (result.dynamicApprovers.length > 0) {
      await prisma.ecoApproverAssignment.createMany({
        data: result.dynamicApprovers.map((approver) => ({
          ecoId,
          stageId: eco.currentStageId,
          userId: approver.userId,
          approvalCategory: approver.approvalCategory,
          ruleId: approver.ruleId ?? null,
          source: 'rule'
        })),
        skipDuplicates: true
      });
    }
    
    // Log the assignment for audit purposes
    console.log(`Rule evaluation for ECO ${ecoId}:`, {
      rulesEvaluated: result.rulesEvaluatedCount,
      rulesTriggered: result.rulesTriggeredCount,
      dynamicApprovers: result.dynamicApprovers.length,
      staticApprovers: result.staticApprovers.length,
      totalApprovers: result.allApprovers.length
    });
    
    return {
      success: true,
      approvers: result.allApprovers,
      stats: {
        rulesEvaluated: result.rulesEvaluatedCount,
        rulesTriggered: result.rulesTriggeredCount,
        dynamicCount: result.dynamicApprovers.length,
        staticCount: result.staticApprovers.length
      }
    };
  } catch (error) {
    console.error(`Error assigning approvers from rules for ECO ${ecoId}:`, error);
    return {
      success: false,
      reason: error.message,
      error: true
    };
  }
}

export default {
  evaluateAndApplyRulesForEco,
  resolveApproverWithDelegation,
  canProceedWithApprovals,
  assignApproversFromRules
};
