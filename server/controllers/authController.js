import User from '../models/userModel.js';
import Invitation from '../models/Invitation.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import apiResponse from '../utils/apiResponse.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Password strength validation
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    return apiResponse.error(res, 'Şifrə ən azı 6 simvol, 1 hərf və 1 rəqəmdən ibarət olmalıdır', 400);
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    return apiResponse.error(res, 'User already exists', 400);
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    status: 'pending',
  });

  if (user) {
    return apiResponse.success(res, 'Registration submitted. Please wait for admin approval before logging in.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
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
    if (user.status === 'pending') {
      return apiResponse.error(res, 'Your account is waiting for admin approval.', 403);
    }

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

  const { password } = req.body;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    return apiResponse.error(res, 'Şifrə ən azı 6 simvol, 1 hərf və 1 rəqəmdən ibarət olmalıdır', 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return apiResponse.success(res, 'Password reset successful');
};

// @desc    Register via invitation
// @route   POST /api/auth/register-invitation/:token
// @access  Public
const registerViaInvitation = async (req, res) => {
  const { name, password } = req.body;
  const { token } = req.params;

  const invitation = await Invitation.findOne({ token, status: 'pending' });

  if (!invitation) {
    return apiResponse.error(res, 'Invalid or expired invitation', 404);
  }

  if (invitation.expiresAt < Date.now()) {
    invitation.status = 'expired';
    await invitation.save();
    return apiResponse.error(res, 'Invitation has expired', 400);
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    return apiResponse.error(res, 'Şifrə ən azı 6 simvol, 1 hərf və 1 rəqəmdən ibarət olmalıdır', 400);
  }

  // Create user
  const user = await User.create({
    name,
    email: invitation.email,
    password,
    role: invitation.role,
    status: 'active',
  });

  if (user) {
    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();

    return apiResponse.success(res, 'User registered successfully via invitation', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    }, 201);
  } else {
    return apiResponse.error(res, 'Invalid user data', 400);
  }
};

// @desc    Google Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return apiResponse.error(res, 'Credential is required', 400);
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password for OAuth users
        role: 'student', // Default role
        status: 'active', // Google users are pre-verified
        googleId,
        avatar: picture,
      });
    } else {
      // Update existing user's googleId if not present
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      
      if (user.status === 'pending') {
        return apiResponse.error(res, 'Hesabınız admin tərəfindən təsdiqlənməyib.', 403);
      }

      if (user.status === 'inactive') {
        return apiResponse.error(res, 'Hesabınız aktiv deyil.', 403);
      }
    }

    return apiResponse.success(res, 'Google login successful', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } catch (error) {
    console.error('Google login error:', error);
    return apiResponse.error(res, 'Google login failed', 401);
  }
};

export { register, login, refreshToken, logout, forgotPassword, resetPassword, registerViaInvitation, googleLogin };
