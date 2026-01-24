import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { success } from '../../utils/response.js';

/**
 * Auth Controllers
 * Handle HTTP requests for authentication endpoints
 */

/**
 * POST /auth/signup
 * Register a new user with engineering role
 */
export const signupController = asyncHandler(async (req, res) => {
  const { loginId, name, email, password } = req.body;

  const result = await authService.signup({ loginId, name, email, password });

  success(res, result, 201);
});

/**
 * POST /auth/login
 * Authenticate user and return token
 */
export const loginController = asyncHandler(async (req, res) => {
  const { loginId, password } = req.body;

  const result = await authService.login({ loginId, password });

  success(res, result, 200);
});

/**
 * GET /auth/me
 * Get current authenticated user
 */
export const meController = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  success(res, { user }, 200);
});

export default { signupController, loginController, meController };
