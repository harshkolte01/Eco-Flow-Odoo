/**
 * Delegation Controller
 * Handles approver delegation management
 */

import DelegationService from "./delegation.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { success, error as errorResponse } from "../../utils/response.js";

const delegationService = new DelegationService();

/**
 * POST /api/delegations
 * Create a new delegation
 */
export const createDelegation = asyncHandler(async (req, res) => {
  const { fromUserId, toUserId, startDate, endDate, reason } = req.body;
  const userId = req.user.id;

  if (!fromUserId || !toUserId || !startDate || !endDate) {
    return res.status(400).json(
      errorResponse("fromUserId, toUserId, startDate, and endDate are required")
    );
  }

  const delegation = await delegationService.createDelegation(
    { fromUserId, toUserId, startDate, endDate, reason },
    userId
  );

  return res.status(201).json(success(delegation, "Delegation created successfully"));
});

/**
 * GET /api/delegations
 * List all delegations
 */
export const listDelegations = asyncHandler(async (req, res) => {
  const { status, fromUserId, toUserId, page = 1, pageSize = 20 } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Non-admin users can only see their own delegations
  let filters = {
    status,
    skip: (parseInt(page) - 1) * parseInt(pageSize),
    take: parseInt(pageSize)
  };

  if (userRole !== "admin") {
    // Show delegations from or to this user
    const result = await delegationService.getActiveDelegationsForUser(userId);
    return res.json(
      success(
        { delegationsFrom: result.delegationsFrom, delegationsTo: result.delegationsTo },
        "User delegations fetched successfully"
      )
    );
  }

  // Admin can filter by any user
  if (fromUserId) filters.fromUserId = parseInt(fromUserId);
  if (toUserId) filters.toUserId = parseInt(toUserId);

  const result = await delegationService.listDelegations(filters);

  return res.json(
    success(
      { delegations: result.delegations, pagination: { page: result.page, pageSize: result.pageSize, total: result.total } },
      "Delegations fetched successfully"
    )
  );
});

/**
 * GET /api/delegations/active-for-user/:userId
 * Get active delegations for a specific user
 */
export const getActiveDelegationsForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;
  const userRole = req.user.role;

  // Non-admin users can only view their own delegations
  if (userRole !== "admin" && parseInt(userId) !== currentUserId) {
    return res.status(403).json(errorResponse("You can only view your own delegations"));
  }

  const result = await delegationService.getActiveDelegationsForUser(parseInt(userId));

  return res.json(success(result, "Active delegations fetched successfully"));
});

/**
 * PATCH /api/delegations/:id/revoke
 * Revoke a delegation
 */
export const revokeDelegation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const delegation = await delegationService.revokeDelegation(id, userId);

  return res.json(success(delegation, "Delegation revoked successfully"));
});

/**
 * DELETE /api/delegations/:id
 * Delete a delegation (admin only)
 */
export const deleteDelegation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const delegation = await delegationService.deleteDelegation(id);

  return res.json(success(delegation, "Delegation deleted successfully"));
});
