/**
 * Approval Rules Routes
 */

import express from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import * as approvalRulesController from "./approval-rules.controller.js";

const router = express.Router();

// ============ APPROVAL RULES ROUTES ============

// Rules CRUD - All require authentication and admin role
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.createRule
);

router.get(
  "/",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.listRules
);

router.get(
  "/:id",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.getRule
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.updateRule
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.deleteRule
);

// Conditions
router.post(
  "/:ruleId/conditions",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.addCondition
);

router.patch(
  "/:ruleId/conditions/:conditionId",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.updateCondition
);

router.delete(
  "/:ruleId/conditions/:conditionId",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.deleteCondition
);

// Approvers
router.post(
  "/:ruleId/approvers",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.addApprover
);

router.delete(
  "/:ruleId/approvers/:approverId",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.removeApprover
);

router.patch(
  "/:ruleId/approvers/:approverId",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.updateApprover
);

// History & Audit
router.get(
  "/:id/history",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.getRuleHistory
);

// Testing & Evaluation
router.post(
  "/:ruleId/test",
  requireAuth,
  requireRole("admin"),
  approvalRulesController.testRule
);

router.post(
  "/evaluate",
  requireAuth,
  approvalRulesController.evaluateRulesForEco
);

export default router;
