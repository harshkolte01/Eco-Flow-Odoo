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
    return errorResponse(res, "fromUserId, toUserId, startDate, and endDate are required", 400);
  }

  const delegation = await delegationService.createDelegation(
    { fromUserId, toUserId, startDate, endDate, reason },
    userId
  );

  return success(res, delegation, 201);
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
    return success(res, {
      delegationsFrom: result.delegationsFrom,
      delegationsTo: result.delegationsTo
    }, 200);
  }

  // Admin can filter by any user
  if (fromUserId) filters.fromUserId = parseInt(fromUserId);
  if (toUserId) filters.toUserId = parseInt(toUserId);

  const result = await delegationService.listDelegations(filters);

  return success(res, {
    data: result.delegations,
    total: result.total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(result.total / parseInt(pageSize))
  }, 200);
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
    return errorResponse(res, "You can only view your own delegations", 403);
  }

  const result = await delegationService.getActiveDelegationsForUser(parseInt(userId));

  return success(res, result, 200);
});

/**
 * PATCH /api/delegations/:id/revoke
 * Revoke a delegation
 */
export const revokeDelegation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const delegation = await delegationService.revokeDelegation(id, userId);

  return success(res, delegation, 200);
});

/**
 * DELETE /api/delegations/:id
 * Delete a delegation (admin only)
 */
export const deleteDelegation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const delegation = await delegationService.deleteDelegation(id);

  return success(res, delegation, 200);
});
