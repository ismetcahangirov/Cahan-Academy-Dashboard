import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  registerViaInvitation,
  googleLogin,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limits for these endpoints live in middleware/rateLimiters.js (applied in server.js)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/register-invitation/:token', registerViaInvitation);
router.post('/google', googleLogin);

export default router;
