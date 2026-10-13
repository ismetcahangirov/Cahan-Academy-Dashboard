import mongoose from 'mongoose';
import User from '../models/userModel.js';

const USER_STATUSES = ['active', 'inactive', 'pending'];
const USER_ROLES = ['admin', 'teacher', 'student'];
const MAX_PAGE_SIZE = 100;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toPositiveInt = (value, fallback) => {
  const number = Number.parseInt(value, 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const handleError = (res, error) => {
  if (error?.code === 11000) {
    return res.status(400).json({ message: 'Bu email artıq istifadə olunur' });
  }
  if (error?.name === 'ValidationError') {
    const message = Object.values(error.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Yanlış ID formatı' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Server xətası baş verdi' });
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update current user profile (name, avatar)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

    if (req.body.name !== undefined) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
      if (!name) return res.status(400).json({ message: 'Ad boş ola bilməz' });
      user.name = name;
    }
    if (req.body.avatar !== undefined) {
      if (typeof req.body.avatar !== 'string') {
        return res.status(400).json({ message: 'Avatar yanlış formatdadır' });
      }
      user.avatar = req.body.avatar;
    }

    const updated = await user.save();
    res.json({
      success: true,
      data: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Change current user password
// @route   PUT /api/users/profile/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Bütün sahələr doldurulmalıdır' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Yeni şifrə ən az 6 simvol olmalıdır' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ message: 'Yeni şifrə cari şifrədən fərqli olmalıdır' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    if (!user.password || !(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Şifrə uğurla yeniləndi' });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const pageSize = Math.min(toPositiveInt(req.query.pageSize, 10), MAX_PAGE_SIZE);
    const page = toPositiveInt(req.query.pageNumber, 1);
    const statusFilter = USER_STATUSES.includes(req.query.status)
      ? { status: req.query.status }
      : {};

    const keywordText = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
    const keyword = keywordText
      ? {
          $or: [
            { name: { $regex: escapeRegex(keywordText), $options: 'i' } },
            { email: { $regex: escapeRegex(keywordText), $options: 'i' } },
          ],
        }
      : {};

    const filters = { ...keyword, ...statusFilter };
    const count = await User.countDocuments(filters);
    const users = await User.find(filters)
      .select('-password')
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ createdAt: -1 });

    res.json({
      users,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

    const { name, email, role, status } = req.body;

    if (status !== undefined && !USER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Yanlış istifadəçi statusu' });
    }
    if (role !== undefined && !USER_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Yanlış istifadəçi rolu' });
    }

    const isSelf = user._id.equals(req.user._id);
    if (isSelf && ((role && role !== user.role) || (status && status !== user.status))) {
      return res.status(400).json({ message: 'Öz rolunuzu və ya statusunuzu dəyişə bilməzsiniz' });
    }

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof email === 'string' && email.trim()) user.email = email.trim().toLowerCase();
    if (role) user.role = role;
    if (status) user.status = status;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Öz hesabınızı silə bilməzsiniz' });
    }

    await user.deleteOne();
    res.json({ message: 'İstifadəçi silindi' });
  } catch (error) {
    handleError(res, error);
  }
};
