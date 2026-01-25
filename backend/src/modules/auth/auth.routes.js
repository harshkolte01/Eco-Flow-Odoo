import express from 'express';
import { 
  signupController, 
  loginController, 
  meController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController
} from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { 
  signupSchema, 
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from './auth.validation.js';

const router = express.Router();

/**
 * @route   POST /auth/signup
 * @desc    Register new user (automatically assigned 'engineering' role)
 * @access  Public
 */
router.post('/signup', validate(signupSchema), signupController);

/**
 * @route   POST /auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', validate(loginSchema), loginController);

/**
 * @route   GET /auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', requireAuth, meController);

/**
 * @route   POST /auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePasswordController);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordController);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController);

export default router;
