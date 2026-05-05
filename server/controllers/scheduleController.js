import asyncHandler from 'express-async-handler';
import Schedule from '../models/Schedule.js';

// @desc    Get schedule (filter by group, teacher, or student)
// @route   GET /api/schedule
// @access  Private
export const getSchedule = asyncHandler(async (req, res) => {
  const { groupId, teacherId, dayOfWeek } = req.query;
  const query = {};

  if (groupId) query.group = groupId;
  if (teacherId) query.teacher = teacherId;
  if (dayOfWeek !== undefined) query.dayOfWeek = dayOfWeek;

  const schedule = await Schedule.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .sort({ dayOfWeek: 1, startTime: 1 });

  res.status(200).json({ success: true, count: schedule.length, data: schedule });
});

// @desc    Get single schedule entry
// @route   GET /api/schedule/:id
// @access  Private
export const getScheduleById = asyncHandler(async (req, res) => {
  const entry = await Schedule.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar');

  if (!entry) {
    res.status(404);
    throw new Error('Cədvəl tapşırığı tapılmadı');
  }

  res.status(200).json({ success: true, data: entry });
});

// @desc    Create schedule entry
// @route   POST /api/schedule
// @access  Private (Admin, Teacher)
export const createScheduleEntry = asyncHandler(async (req, res) => {
  const { group, subject, teacher, dayOfWeek, startTime, endTime, room } = req.body;

  if (!group || !subject || !teacher || dayOfWeek === undefined || !startTime || !endTime) {
    res.status(400);
    throw new Error('Bütün məcburi sahələri doldurun');
  }

  const entry = await Schedule.create({ group, subject, teacher, dayOfWeek, startTime, endTime, room });
  const populated = await entry.populate([
    { path: 'group', select: 'name' },
    { path: 'teacher', select: 'name avatar' },
  ]);

  res.status(201).json({ success: true, data: populated });
});

// @desc    Update schedule entry
// @route   PUT /api/schedule/:id
// @access  Private (Admin, Teacher)
export const updateScheduleEntry = asyncHandler(async (req, res) => {
  const entry = await Schedule.findById(req.params.id);

  if (!entry) {
    res.status(404);
    throw new Error('Cədvəl tapşırığı tapılmadı');
  }

  const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate('group', 'name')
    .populate('teacher', 'name avatar');

  res.status(200).json({ success: true, data: updated });
});

// @desc    Delete schedule entry
// @route   DELETE /api/schedule/:id
// @access  Private (Admin)
export const deleteScheduleEntry = asyncHandler(async (req, res) => {
  const entry = await Schedule.findById(req.params.id);

  if (!entry) {
    res.status(404);
    throw new Error('Cədvəl tapşırığı tapılmadı');
  }

  await entry.deleteOne();

  res.status(200).json({ success: true, message: 'Cədvəl tapşırığı silindi' });
});
