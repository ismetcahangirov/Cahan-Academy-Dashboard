import Invitation from '../models/Invitation.js';
import User from '../models/userModel.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * @desc    Get all invitations
 * @route   GET /api/invitations
 * @access  Private/Admin
 */
export const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find()
      .populate('invitedBy', 'name email')
      .sort('-createdAt');

    return sendSuccess(res, 'Invitations fetched successfully', invitations);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Create and send invitation
 * @route   POST /api/invitations
 * @access  Private/Admin
 */
export const sendInvitation = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User with this email already exists', 400);
    }

    // Check if pending invitation exists
    const pendingInv = await Invitation.findOne({ email, status: 'pending' });
    if (pendingInv) {
      return sendError(res, 'A pending invitation already exists for this email', 400);
    }

    // Create invitation
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const invitation = await Invitation.create({
      email,
      role,
      invitedBy: req.user._id,
      expiresAt,
    });

    // Send Email
    const acceptUrl = `${process.env.CLIENT_URL}/accept-invitation/${invitation.token}`;
    const message = `
      <h1>Siz Cahan Academy-yə dəvət olundunuz!</h1>
      <p>Sizə ${role === 'teacher' ? 'müəllim' : 'tələbə'} rolu ilə dəvət göndərilib.</p>
      <p>Dəvəti qəbul etmək və qeydiyyatdan keçmək üçün aşağıdakı linkə klikləyin:</p>
      <a href="${acceptUrl}" style="display:inline-block; background:#b01b2e; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Dəvəti Qəbul Et</a>
      <p>Bu link 7 gün ərzində aktivdir.</p>
    `;

    try {
      await sendEmail({
        email: invitation.email,
        subject: 'Cahan Academy Dəvəti',
        html: message,
      });
    } catch (err) {
      // If email fails, delete invitation and return error
      await Invitation.findByIdAndDelete(invitation._id);
      return sendError(res, 'Email could not be sent', 500);
    }

    return sendSuccess(res, 'Invitation sent successfully', invitation);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Verify invitation token
 * @route   GET /api/invitations/verify/:token
 * @access  Public
 */
export const verifyInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ 
      token: req.params.token, 
      status: 'pending' 
    });

    if (!invitation) {
      return sendError(res, 'Invalid or expired invitation', 404);
    }

    if (invitation.expiresAt < Date.now()) {
      invitation.status = 'expired';
      await invitation.save();
      return sendError(res, 'Invitation has expired', 400);
    }

    return sendSuccess(res, 'Invitation is valid', {
      email: invitation.email,
      role: invitation.role,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Delete/Cancel invitation
 * @route   DELETE /api/invitations/:id
 * @access  Private/Admin
 */
export const deleteInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return sendError(res, 'Invitation not found', 404);
    }

    invitation.status = 'cancelled';
    await invitation.save();

    return sendSuccess(res, 'Invitation cancelled successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
