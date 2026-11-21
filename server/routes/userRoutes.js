import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  updatePassword
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Profil marşrutları - Bütün daxil olmuş istifadəçilər üçündür
router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.route('/profile/password')
  .put(updatePassword);

// Aşağıdakı marşrutlar ancaq adminlər üçündür
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

export default router;
