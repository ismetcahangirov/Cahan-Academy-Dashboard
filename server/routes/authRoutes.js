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
import rateLimit from 'express-rate-limit';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per `window` (here, per 15 minutes)
  message: { message: 'Bu IP-dən çox sayda uğursuz cəhd. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.' },
});

router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);
router.post('/register-invitation/:token', registerViaInvitation);
router.post('/google', googleLogin);

export default router;
