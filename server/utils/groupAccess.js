import mongoose from 'mongoose';
import Group from '../models/Group.js';

const sameId = (a, b) => a != null && b != null && (a._id ?? a).toString() === (b._id ?? b).toString();

export const isGroupTeacher = (user, group) => !!group && sameId(group.teacher, user._id);

export const isGroupStudent = (user, group) =>
  !!group && (group.students || []).some((s) => sameId(s, user._id));

// Admin or the group's own teacher
export const canManageGroup = (user, group) => user.role === 'admin' || isGroupTeacher(user, group);

// Admin, the group's teacher, or a student of the group
export const canViewGroup = (user, group) =>
  canManageGroup(user, group) || (user.role === 'student' && isGroupStudent(user, group));

// Group ids the user may see; null means no restriction (admin)
export const getAccessibleGroupIds = async (user) => {
  if (user.role === 'admin') return null;
  const filter = user.role === 'teacher' ? { teacher: user._id } : { students: user._id };
  return Group.find(filter).distinct('_id');
};

// Mongo filter value for a `group` field: own groups, optionally narrowed to one requested group
export const buildGroupFilter = async (user, requestedGroupId) => {
  const accessible = await getAccessibleGroupIds(user);
  if (!requestedGroupId) return accessible ? { $in: accessible } : undefined;
  if (typeof requestedGroupId !== 'string' || !mongoose.isValidObjectId(requestedGroupId)) return { $in: [] };
  if (accessible && !accessible.some((id) => sameId(id, requestedGroupId))) return { $in: [] };
  return new mongoose.Types.ObjectId(requestedGroupId);
};
