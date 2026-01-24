/**
 * Approval Rules Controller
 * Handles HTTP requests for approval rules management
 */

import ApprovalRulesService from "./approval-rules.service.js";
import RuleEvaluationService from "./rule-evaluation.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success, error as errorResponse } from "../../utils/response.js";

const approvalRulesService = new ApprovalRulesService();
const ruleEvaluationService = new RuleEvaluationService();

// ============ RULE CRUD OPERATIONS ============

/**
 * POST /api/approval-rules
 * Create a new approval rule
 */
export const createRule = asyncHandler(async (req, res) => {
  const { name, description, ruleType, priority, stageIds, conditions, approvers } = req.body;
  const userId = req.user.id;

  // Validation
  if (!name || !stageIds || !Array.isArray(stageIds)) {
    return res.status(400).json(
      errorResponse("name and stageIds are required", [])
    );
  }

  const rule = await approvalRulesService.createRule(
    { name, description, ruleType, priority, stageIds, conditions, approvers },
    userId
  );

  return res.status(201).json(success(rule, "Approval rule created successfully"));
});

/**
 * GET /api/approval-rules
 * List all approval rules with filters
 */
export const listRules = asyncHandler(async (req, res) => {
  const { isActive, ruleType, stageId, page = 1, pageSize = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(pageSize);

  const result = await approvalRulesService.listRules({
    isActive: isActive === "true",
    ruleType,
    stageId: stageId ? parseInt(stageId) : null,
    skip,
    take: parseInt(pageSize)
  });

  return res.json(
    success(
      { rules: result.rules, pagination: { page: result.page, pageSize: result.pageSize, total: result.total } },
      "Approval rules fetched successfully"
    )
  );
});

/**
 * GET /api/approval-rules/:id
 * Get a single approval rule
 */
export const getRule = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const rule = await approvalRulesService.getRule(id);

  return res.json(success(rule, "Approval rule fetched successfully"));
});

/**
 * PATCH /api/approval-rules/:id
 * Update an approval rule
 */
export const updateRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, description, ruleType, priority, stageIds, isActive } = req.body;

  const rule = await approvalRulesService.updateRule(
    id,
    { name, description, ruleType, priority, stageIds, isActive },
    userId
  );

  return res.json(success(rule, "Approval rule updated successfully"));
});

/**
 * DELETE /api/approval-rules/:id
 * Delete (archive) an approval rule
 */
export const deleteRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const rule = await approvalRulesService.deleteRule(id, userId);

  return res.json(success(rule, "Approval rule deleted successfully"));
});

// ============ CONDITION OPERATIONS ============

/**
 * POST /api/approval-rules/:ruleId/conditions
 * Add a condition to a rule
 */
export const addCondition = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  const userId = req.user.id;
  const { fieldName, operator, fieldValue, logicalOperator } = req.body;

  if (!fieldName || !operator || !fieldValue) {
    return res.status(400).json(
      errorResponse("fieldName, operator, and fieldValue are required")
    );
  }

  const condition = await approvalRulesService.addCondition(
    ruleId,
    { fieldName, operator, fieldValue, logicalOperator },
    userId
  );

  return res.status(201).json(success(condition, "Condition added successfully"));
});

/**
 * PATCH /api/approval-rules/:ruleId/conditions/:conditionId
 * Update a condition
 */
export const updateCondition = asyncHandler(async (req, res) => {
  const { conditionId } = req.params;
  const userId = req.user.id;
  const { fieldName, operator, fieldValue, logicalOperator } = req.body;

  const condition = await approvalRulesService.updateCondition(
    conditionId,
    { fieldName, operator, fieldValue, logicalOperator },
    userId
  );

  return res.json(success(condition, "Condition updated successfully"));
});

/**
 * DELETE /api/approval-rules/:ruleId/conditions/:conditionId
 * Delete a condition
 */
export const deleteCondition = asyncHandler(async (req, res) => {
  const { conditionId } = req.params;
  const userId = req.user.id;

  const condition = await approvalRulesService.deleteCondition(conditionId, userId);

  return res.json(success(condition, "Condition deleted successfully"));
});

// ============ APPROVER OPERATIONS ============

/**
 * POST /api/approval-rules/:ruleId/approvers
 * Add an approver to a rule
 */
export const addApprover = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  const userId = req.user.id;
  const { userId: approverId, approvalCategory, canDelegate, escalationUserId, escalationThresholdDays } = req.body;

  if (!approverId) {
    return res.status(400).json(errorResponse("userId is required"));
  }

  const approver = await approvalRulesService.addApprover(
    ruleId,
    { userId: approverId, approvalCategory, canDelegate, escalationUserId, escalationThresholdDays },
    userId
  );

  return res.status(201).json(success(approver, "Approver added successfully"));
});

/**
 * DELETE /api/approval-rules/:ruleId/approvers/:approverId
 * Remove an approver from a rule
 */
export const removeApprover = asyncHandler(async (req, res) => {
  const { ruleId, approverId } = req.params;
  const userId = req.user.id;

  const approver = await approvalRulesService.removeApprover(ruleId, parseInt(approverId), userId);

  return res.json(success(approver, "Approver removed successfully"));
});

/**
 * PATCH /api/approval-rules/:ruleId/approvers/:approverId
 * Update approver settings (escalation, delegation, etc.)
 */
export const updateApprover = asyncHandler(async (req, res) => {
  const { ruleId, approverId } = req.params;
  const userId = req.user.id;
  const { canDelegate, escalationUserId, escalationThresholdDays, approvalCategory } = req.body;

  const approver = await approvalRulesService.updateApprover(
    ruleId,
    parseInt(approverId),
    { canDelegate, escalationUserId, escalationThresholdDays, approvalCategory },
    userId
  );

  return res.json(success(approver, "Approver updated successfully"));
});

// ============ AUDIT & HISTORY ============

/**
 * GET /api/approval-rules/:id/history
 * Get rule history (audit trail)
 */
export const getRuleHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const history = await approvalRulesService.getRuleHistory(id);

  return res.json(success(history, "Rule history fetched successfully"));
});

// ============ EVALUATION & TESTING ============

/**
 * POST /api/approval-rules/:ruleId/test
 * Test a rule with mock ECO data
 */
export const testRule = asyncHandler(async (req, res) => {
  const { ruleId } = req.params;
  const mockEcoData = req.body;

  const result = await ruleEvaluationService.simulateRuleEvaluation(ruleId, mockEcoData);

  return res.json(success(result, "Rule simulation completed successfully"));
});

/**
 * POST /api/approval-rules/evaluate
 * Evaluate which rules would apply to an ECO
 */
export const evaluateRulesForEco = asyncHandler(async (req, res) => {
  const { ecoId } = req.body;

  if (!ecoId) {
    return res.status(400).json(errorResponse("ecoId is required"));
  }

  const result = await ruleEvaluationService.evaluateRulesForEco(ecoId);

  return res.json(success(result, "ECO rules evaluated successfully"));
});
