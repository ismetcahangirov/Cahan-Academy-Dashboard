import express from 'express';
import { getStats, getRecentActivities } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Bütün dashboard marşrutları qorunur
router.use(protect);

router.get('/stats', getStats);
router.get('/activities', getRecentActivities);

export default router;
