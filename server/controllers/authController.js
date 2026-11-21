import User from '../models/userModel.js';
import Invitation from '../models/Invitation.js';
import { generateToken, generateRefreshToken } from '../utils/generateToken.js';
import apiResponse from '../utils/apiResponse.js';
import sendEmail, { buildClientUrl } from '../utils/sendEmail.js';
import { isValidPassword, PASSWORD_RULE_MESSAGE } from '../utils/passwordPolicy.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const PENDING_MESSAGE = 'Your account is waiting for admin approval.';
const INACTIVE_MESSAGE = 'Your account is inactive. Please contact admin.';
const FORGOT_PASSWORD_MESSAGE = 'If an account with that email exists, a password reset link has been sent.';
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!isValidPassword(password)) {
    return apiResponse.error(res, PASSWORD_RULE_MESSAGE, 400);
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
      return apiResponse.error(res, PENDING_MESSAGE, 403);
    }

    if (user.status === 'inactive') {
      return apiResponse.error(res, INACTIVE_MESSAGE, 403);
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
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email) {
    return apiResponse.error(res, 'Email is required', 400);
  }

  const user = await User.findOne({ email });

  // Same answer whether or not the account exists, so the endpoint can't be used to probe emails.
  if (!user) {
    return apiResponse.success(res, FORGOT_PASSWORD_MESSAGE);
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = hashToken(resetToken);
  user.resetPasswordExpire = Date.now() + RESET_TOKEN_TTL_MS;
  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = buildClientUrl(`/reset-password/${resetToken}`);
    await sendEmail({
      email: user.email,
      subject: 'Cahan Academy: şifrənin bərpası',
      message: `Şifrənizi yeniləmək üçün bu linkə keçin (10 dəqiqə etibarlıdır): ${resetUrl}\n\nBu sorğunu siz göndərməmisinizsə, bu məktuba məhəl qoymayın.`,
      html: `
        <h1>Şifrənin bərpası</h1>
        <p>Cahan Academy hesabınız üçün şifrə bərpası istənildi.</p>
        <p>Yeni şifrə təyin etmək üçün aşağıdakı linkə klikləyin:</p>
        <a href="${resetUrl}" style="display:inline-block; background:#b01b2e; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Şifrəni yenilə</a>
        <p>Bu link 10 dəqiqə ərzində aktivdir.</p>
        <p>Bu sorğunu siz göndərməmisinizsə, bu məktuba məhəl qoymayın.</p>
      `,
    });
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return apiResponse.error(res, 'Email could not be sent. Please try again later.', 500);
  }

  return apiResponse.success(res, FORGOT_PASSWORD_MESSAGE);
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashToken(req.params.token),
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return apiResponse.error(res, 'Invalid or expired token', 400);
  }

  const { password } = req.body;
  if (!isValidPassword(password)) {
    return apiResponse.error(res, PASSWORD_RULE_MESSAGE, 400);
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

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    return apiResponse.error(res, 'Name is required', 400);
  }

  if (!isValidPassword(password)) {
    return apiResponse.error(res, PASSWORD_RULE_MESSAGE, 400);
  }

  if (await User.exists({ email: invitation.email })) {
    return apiResponse.error(res, 'User already exists', 400);
  }

  const user = await User.create({
    name: trimmedName,
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
    const { name, picture, sub: googleId } = payload;
    const email = payload.email?.toLowerCase();

    if (!email || !payload.email_verified) {
      return apiResponse.error(res, 'Google account email is not verified', 401);
    }

    const user = await User.findOne({ email });

    if (!user) {
      // New Google accounts wait for admin approval, same as email registration.
      await User.create({
        name,
        email,
        password: crypto.randomBytes(16).toString('hex'), // Random password for OAuth users
        role: 'student',
        status: 'pending',
        googleId,
        avatar: picture,
      });
      return apiResponse.error(res, PENDING_MESSAGE, 403);
    }

    // Update existing user's googleId if not present
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    if (user.status === 'pending') {
      return apiResponse.error(res, PENDING_MESSAGE, 403);
    }

    if (user.status === 'inactive') {
      return apiResponse.error(res, INACTIVE_MESSAGE, 403);
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
