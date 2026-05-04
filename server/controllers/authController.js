import User from '../models/userModel.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import apiResponse from '../utils/apiResponse.js';
import crypto from 'crypto';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return apiResponse.error(res, 'User already exists', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student', // Default to student
  });

  if (user) {
    return apiResponse.success(res, 'User registered successfully', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    }, 201);
  } else {
    return apiResponse.error(res, 'Invalid user data', 400);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    if (user.status === 'inactive') {
      return apiResponse.error(res, 'Your account is inactive. Please contact admin.', 403);
    }

    return apiResponse.success(res, 'Login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } else {
    return apiResponse.error(res, 'Invalid email or password', 401);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return apiResponse.error(res, 'Refresh token is required', 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return apiResponse.error(res, 'User not found', 404);
    }

    return apiResponse.success(res, 'Token refreshed', {
      token: generateToken(user._id),
    });
  } catch (error) {
    return apiResponse.error(res, 'Invalid refresh token', 401);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  // In a real app with cookies, you'd clear them here.
  // For JWT in headers, the client just deletes the token.
  return apiResponse.success(res, 'Logged out successfully');
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return apiResponse.error(res, 'User not found', 404);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save();

  // In a real app, you'd send an email here.
  return apiResponse.success(res, 'Password reset token generated (simulated email)', {
    resetToken,
  });
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return apiResponse.error(res, 'Invalid or expired token', 400);
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return apiResponse.success(res, 'Password reset successful');
};

export { register, login, refreshToken, logout, forgotPassword, resetPassword };
