import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update current user profile (name, avatar)
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

    user.name = req.body.name || user.name;
    if (req.body.avatar !== undefined) user.avatar = req.body.avatar;

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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change current user password
// @route   PUT /api/users/profile/password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Bütün sahələr doldurulmalıdır' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Yeni şifrə ən az 6 simvol olmalıdır' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Şifrə uğurla yeniləndi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.pageNumber) || 1;
    const statusFilter = ['active', 'inactive', 'pending'].includes(req.query.status)
      ? { status: req.query.status }
      : {};

    const keyword = req.query.keyword
      ? {
          $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { email: { $regex: req.query.keyword, $options: 'i' } },
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      if (req.body.status && !['active', 'inactive', 'pending'].includes(req.body.status)) {
        return res.status(400).json({ message: 'Invalid user status' });
      }

      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.status = req.body.status || user.status;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
      });
    } else {
      res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Admin özünü silə bilməz
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Öz hesabınızı silə bilməzsiniz' });
      }
      
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'İstifadəçi silindi' });
    } else {
      res.status(404).json({ message: 'İstifadəçi tapılmadı' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
