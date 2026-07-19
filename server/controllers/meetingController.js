import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import Schedule from '../models/Schedule.js';
import Meeting from '../models/Meeting.js';
import { getAcademyNow, dayOfWeekForDateStr, academyDateStr, toMinutes } from '../utils/academyTime.js';

const JOIN_EARLY_MINUTES = 10;

function canAccessSchedule(user, schedule) {
  if (user.role === 'admin') return true;
  const teacherId = schedule.teacher?._id || schedule.teacher;
  if (teacherId && String(teacherId) === String(user._id)) return true;
  const students = schedule.group?.students || [];
  return students.some((s) => String(s) === String(user._id));
}

// @desc   Join or create the meeting room for an online class occurrence
// @route  POST /api/meetings/join-or-create/:scheduleId
// @access Private (admin, the class teacher, or students in the group)
export const joinOrCreateMeeting = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.scheduleId)
    .populate('group', 'name students')
    .populate('teacher', 'name');

  if (!schedule) {
    res.status(404);
    throw new Error('Cədvəl tapşırığı tapılmadı');
  }
  if (schedule.type !== 'online') {
    res.status(400);
    throw new Error('Bu dərs online deyil');
  }
  if (!canAccessSchedule(req.user, schedule)) {
    res.status(403);
    throw new Error('Bu dərsə giriş icazəniz yoxdur');
  }

  const academyNow = getAcademyNow();
  const occurrenceDate = req.body?.date || academyNow.dateStr;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)) {
    res.status(400);
    throw new Error('Yanlış tarix formatı');
  }

  // Requested date must match the schedule's recurrence.
  if (schedule.repetitionType === 'once') {
    if (!schedule.specificDate || academyDateStr(schedule.specificDate) !== occurrenceDate) {
      res.status(400);
      throw new Error('Tarix bu dərsə uyğun deyil');
    }
  } else if (dayOfWeekForDateStr(occurrenceDate) !== schedule.dayOfWeek) {
    res.status(400);
    throw new Error('Tarix bu dərsin gününə uyğun deyil');
  }

  // Only the current-day occurrence can be joined, within [start-10m, end].
  if (occurrenceDate !== academyNow.dateStr) {
    res.status(403);
    throw new Error('Yalnız cari dərsə qoşula bilərsiniz');
  }
  const nowMin = academyNow.hour * 60 + academyNow.minute;
  if (nowMin < toMinutes(schedule.startTime) - JOIN_EARLY_MINUTES || nowMin > toMinutes(schedule.endTime)) {
    res.status(403);
    throw new Error('Dərs hələ başlamayıb və ya artıq bitib');
  }

  const meeting = await Meeting.findOneAndUpdate(
    { schedule: schedule._id, occurrenceDate },
    {
      $setOnInsert: {
        schedule: schedule._id,
        group: schedule.group?._id,
        teacher: schedule.teacher?._id,
        subject: schedule.subject,
        occurrenceDate,
        roomName: `cahanacademy-${crypto.randomUUID()}`,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        status: 'active',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const alreadyIn = meeting.participants.some(
    (p) => String(p.user) === String(req.user._id) && !p.leftAt
  );
  if (!alreadyIn) {
    meeting.participants.push({ user: req.user._id, joinedAt: new Date() });
    await meeting.save();
  }

  res.status(200).json({
    success: true,
    data: {
      meetingId: meeting._id,
      roomName: meeting.roomName,
      subject: meeting.subject || schedule.subject,
      displayName: req.user.name,
      email: req.user.email,
      jitsiDomain: process.env.JITSI_DOMAIN || 'meet.jit.si',
    },
  });
});

// @desc   Record that the current user left the meeting (best-effort)
// @route  POST /api/meetings/:id/leave
// @access Private
export const leaveMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findById(req.params.id);
  if (!meeting) {
    res.status(404);
    throw new Error('Görüş tapılmadı');
  }
  const entry = [...meeting.participants]
    .reverse()
    .find((p) => String(p.user) === String(req.user._id) && !p.leftAt);
  if (entry) {
    entry.leftAt = new Date();
    await meeting.save();
  }
  res.status(200).json({ success: true, data: null });
});
