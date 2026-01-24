/**
 * Approval Rules Routes
 */

import express from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware.js";
import * as approvalRulesController from "./approval-rules.controller.js";
import * as delegationController from "./delegation.controller.js";

const router = express.Router();

// ============ APPROVAL RULES ROUTES ============

// Rules CRUD - All require authentication and admin role
router.post(
  "/",
  authenticate,
  authorize("admin"),
  approvalRulesController.createRule
);

router.get(
  "/",
  authenticate,
  authorize("admin"),
  approvalRulesController.listRules
);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  approvalRulesController.getRule
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  approvalRulesController.updateRule
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  approvalRulesController.deleteRule
);

// Conditions
router.post(
  "/:ruleId/conditions",
  authenticate,
  authorize("admin"),
  approvalRulesController.addCondition
);

router.patch(
  "/:ruleId/conditions/:conditionId",
  authenticate,
  authorize("admin"),
  approvalRulesController.updateCondition
);

router.delete(
  "/:ruleId/conditions/:conditionId",
  authenticate,
  authorize("admin"),
  approvalRulesController.deleteCondition
);

// Approvers
router.post(
  "/:ruleId/approvers",
  authenticate,
  authorize("admin"),
  approvalRulesController.addApprover
);

router.delete(
  "/:ruleId/approvers/:approverId",
  authenticate,
  authorize("admin"),
  approvalRulesController.removeApprover
);

router.patch(
  "/:ruleId/approvers/:approverId",
  authenticate,
  authorize("admin"),
  approvalRulesController.updateApprover
);

// History & Audit
router.get(
  "/:id/history",
  authenticate,
  authorize("admin"),
  approvalRulesController.getRuleHistory
);

// Testing & Evaluation
router.post(
  "/:ruleId/test",
  authenticate,
  authorize("admin"),
  approvalRulesController.testRule
);

router.post(
  "/evaluate",
  authenticate,
  approvalRulesController.evaluateRulesForEco
);

// ============ DELEGATION ROUTES ============

// Delegations - Admins can manage all, approvers can view their own
router.post(
  "/delegations",
  authenticate,
  authorize("admin"),
  delegationController.createDelegation
);

router.get(
  "/delegations",
  authenticate,
  delegationController.listDelegations
);

router.get(
  "/delegations/active-for-user/:userId",
  authenticate,
  delegationController.getActiveDelegationsForUser
);

router.patch(
  "/delegations/:id/revoke",
  authenticate,
  delegationController.revokeDelegation
);

router.delete(
  "/delegations/:id",
  authenticate,
  authorize("admin"),
  delegationController.deleteDelegation
);

export default router;
