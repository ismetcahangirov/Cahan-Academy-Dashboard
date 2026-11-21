import Group from '../models/Group.js';
import { createNotification } from './notificationService.js';

// Best-effort fan-out: never throws, so a notification problem cannot fail the request.
export const notifyStudents = async (studentIds, data) => {
  try {
    const unique = [...new Set((studentIds || []).map((id) => id.toString()))];
    await Promise.all(unique.map((recipient) => createNotification({ ...data, recipient })));
  } catch (error) {
    console.error('Bildiriş göndərilə bilmədi:', error);
  }
};

export const notifyGroupStudents = async (groupId, data) => {
  try {
    const group = await Group.findById(groupId).select('students');
    if (group) await notifyStudents(group.students, data);
  } catch (error) {
    console.error('Bildiriş göndərilə bilmədi:', error);
  }
};
