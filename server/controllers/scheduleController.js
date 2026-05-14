import asyncHandler from 'express-async-handler';
import Schedule from '../models/Schedule.js';
import Group from '../models/Group.js';

// @desc    Get schedule (filter by group, teacher, or student)
// @route   GET /api/schedule
// @access  Private
export const getSchedule = asyncHandler(async (req, res) => {
  const { groupId, teacherId, dayOfWeek } = req.query;
  const query = {};

  if (groupId) query.group = groupId;
  if (teacherId) query.teacher = teacherId;
  if (dayOfWeek !== undefined) query.dayOfWeek = dayOfWeek;

  // Role-based access control
  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    const studentGroups = await Group.find({ students: req.user._id }).select('_id');
    const groupIds = studentGroups.map(g => g._id);
    query.group = { $in: groupIds };
  }

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
  const { group, subject, teacher, days, startTime, endTime, room, type, note, repetitionType, specificDate } = req.body;

  if (!group || !subject || !teacher || !startTime || !endTime) {
    res.status(400);
    throw new Error('Bütün məcburi sahələri doldurun');
  }

  if (repetitionType === 'weekly' && (!days || days.length === 0)) {
    res.status(400);
    throw new Error('Gün seçilməlidir');
  }

  if (repetitionType === 'once' && !specificDate) {
    res.status(400);
    throw new Error('Tarix seçilməlidir');
  }

  let entriesToCreate = [];

  if (repetitionType === 'weekly') {
    for (const d of days) {
      entriesToCreate.push({ group, subject, teacher, dayOfWeek: d, startTime, endTime, room, type, note, repetitionType, specificDate });
    }
  } else {
    entriesToCreate.push({ group, subject, teacher, startTime, endTime, room, type, note, repetitionType, specificDate });
  }

  const createdEntries = await Schedule.insertMany(entriesToCreate);

  // Sync back to Group details
  const groupDoc = await Group.findById(group);
  if (groupDoc) {
    groupDoc.schedule = {
      repetitionType,
      days: repetitionType === 'weekly' ? days : [],
      specificDate: repetitionType === 'once' ? specificDate : null,
      startTime,
      endTime,
      type,
      note
    };
    await groupDoc.save();
    
    // Clean up old schedule entries for this group that are not the newly created ones
    const newIds = createdEntries.map(e => e._id);
    await Schedule.deleteMany({ group: groupDoc._id, _id: { $nin: newIds } });
  }

  const populated = await Schedule.findById(createdEntries[0]._id).populate([
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
