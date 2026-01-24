import express from 'express';
import { signupController, loginController, meController } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { signupSchema, loginSchema } from './auth.validation.js';

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

export default router;
