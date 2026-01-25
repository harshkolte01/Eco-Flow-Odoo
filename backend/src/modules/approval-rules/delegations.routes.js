/**
 * Delegations Routes
 * Separate routes for delegation management
 */

import express from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import * as delegationController from "./delegation.controller.js";

const router = express.Router();

// Delegations - Admins can manage all, approvers can view their own
router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  delegationController.createDelegation
);

router.get(
  "/",
  requireAuth,
  delegationController.listDelegations
);

router.get(
  "/active-for-user/:userId",
  requireAuth,
  delegationController.getActiveDelegationsForUser
);

router.patch(
  "/:id/revoke",
  requireAuth,
  delegationController.revokeDelegation
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  delegationController.deleteDelegation
);

export default router;
