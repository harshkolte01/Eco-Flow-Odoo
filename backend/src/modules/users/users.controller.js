import * as usersService from './users.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * Users Controllers
 * Handle HTTP requests for user management endpoints
 */

/**
 * GET /users
 * Get all users with optional filtering and pagination
 */
export const getUsersController = asyncHandler(async (req, res) => {
  const { role, page, limit } = req.query;

  const options = {
    role,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20
  };

  const result = await usersService.getUsers(options);

  success(res, { users: result.users, pagination: result.pagination }, 200);
});

/**
 * PATCH /users/:id/role
 * Update user role (admin only)
 */
export const updateUserRoleController = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { roleName } = req.body;
  const currentUserId = req.user.id;

  const user = await usersService.updateUserRole(userId, roleName, currentUserId);

  success(res, { user }, 200);
});

export default { getUsersController, updateUserRoleController };
