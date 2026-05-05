import Notification from '../models/Notification.js';

/**
 * Service to easily create notifications
 * @param {Object} data - Notification data
 * @param {ObjectId} data.recipient - User ID to receive the notification
 * @param {ObjectId} [data.sender] - Optional user ID who sent it
 * @param {String} data.type - 'system', 'homework', 'quiz', 'classwork', 'message', 'other'
 * @param {String} data.title - Notification title
 * @param {String} data.message - Notification message
 * @param {String} [data.link] - Optional link to redirect
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    return notification;
  } catch (error) {
    console.error('Bildiriş yaradılarkən xəta baş verdi:', error);
    // Don't throw to prevent interrupting the main process
    return null;
  }
};
