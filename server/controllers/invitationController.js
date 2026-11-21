import Invitation from '../models/Invitation.js';
import User from '../models/userModel.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import sendEmail, { buildClientUrl } from '../utils/sendEmail.js';

const INVITATION_ROLES = ['teacher', 'student'];

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
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { role } = req.body;

    if (!email) {
      return sendError(res, 'Email is required', 400);
    }
    if (!INVITATION_ROLES.includes(role)) {
      return sendError(res, 'Role must be teacher or student', 400);
    }

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

    try {
      const acceptUrl = buildClientUrl(`/accept-invitation/${invitation.token}`);
      const roleLabel = role === 'teacher' ? 'müəllim' : 'tələbə';
      await sendEmail({
        email: invitation.email,
        subject: 'Cahan Academy Dəvəti',
        message: `Siz Cahan Academy-yə ${roleLabel} rolu ilə dəvət olundunuz. Qeydiyyatı tamamlamaq üçün bu linkə keçin (7 gün etibarlıdır): ${acceptUrl}`,
        html: `
          <h1>Siz Cahan Academy-yə dəvət olundunuz!</h1>
          <p>Sizə ${roleLabel} rolu ilə dəvət göndərilib.</p>
          <p>Dəvəti qəbul etmək və qeydiyyatdan keçmək üçün aşağıdakı linkə klikləyin:</p>
          <a href="${acceptUrl}" style="display:inline-block; background:#b01b2e; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Dəvəti Qəbul Et</a>
          <p>Bu link 7 gün ərzində aktivdir.</p>
        `,
      });
    } catch (err) {
      // No email means nobody can accept it, so don't keep the invitation around.
      console.error('Invitation email failed:', err.message);
      await Invitation.findByIdAndDelete(invitation._id);
      return sendError(res, 'Invitation email could not be sent. Check the email (SMTP) settings and try again.', 500);
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
