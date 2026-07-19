# Jitsi Meet Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cədvəldəki online dərslərə dərsdən 10 dəqiqə əvvəl aktivləşən "Qoşul" düyməsi əlavə et; kliklədikdə istifadəçi embedded Jitsi (meet.jit.si) otağına qoşulsun — recording OLMADAN, 0 büdcə ilə.

**Architecture:** Backend (Node/Express + MongoDB, Vercel serverless) bir stateless `join-or-create` endpoint verir: giriş (rol/qrup) + online + vaxt pəncərəsi (Asia/Baku) yoxlanır, hər occurrence üçün `Meeting` sənədi upsert olunur və təsadüfi otaq adı qaytarılır. Frontend (React JS/JSX + RTK Query) cədvəldə `JoinClassButton` göstərir və tam ekran `MeetingRoom` səhifəsində `JitsiMeetExternalAPI` ilə otağı embed edir. Daimi WebSocket yoxdur → serverless uyğun.

**Tech Stack:** Express 5, Mongoose, Jitsi External API (meet.jit.si), RTK Query, React Router v7, vitest + supertest + mongodb-memory-server (backend), vitest + jsdom (frontend), i18next.

**Spec:** `docs/superpowers/specs/2026-07-19-jitsi-meet-integration-design.md`

---

## Fayl strukturu

**Backend — yeni:**
- `server/utils/academyTime.js` — Asia/Baku vaxt köməkçiləri
- `server/models/Meeting.js` — occurrence sənədi
- `server/controllers/meetingController.js` — join-or-create + leave
- `server/routes/meetingRoutes.js` — route-lar
- `server/test/utils/academyTime.test.js`, `server/test/routes/meetingRoutes.test.js`

**Backend — dəyişən:**
- `server/server.js` — `/api/meetings` qeydiyyatı
- `server/.env.example` — yeni env-lər

**Frontend — yeni:**
- `client/src/utils/academyTime.js` — vaxt/pəncərə məntiqi (+ `academyTime.test.js`)
- `client/src/features/meetings/meetingsApi.js` — RTK Query
- `client/src/components/schedule/JoinClassButton.jsx`
- `client/src/pages/meeting/MeetingRoom.jsx`

**Frontend — dəyişən:**
- `client/src/pages/schedule/Schedule.jsx` — düymə əlavəsi
- `client/src/App.jsx` — route
- `client/src/app/api/apiSlice.js` — `'Meeting'` tag
- `client/src/i18n/locales/{az,en,ru}.json` — sətirlər
- `client/.env.example` — `VITE_ACADEMY_TIMEZONE`

**Sənəd:**
- `docs/DEPLOYMENT.md` — yeni env-lər

---

## Task 1: Server academy-time util

**Files:**
- Create: `server/utils/academyTime.js`
- Test: `server/test/utils/academyTime.test.js`

- [ ] **Step 1: Write the failing test**

`server/test/utils/academyTime.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { getAcademyNow, dayOfWeekForDateStr, academyDateStr, toMinutes } from '../../utils/academyTime.js';

describe('academyTime (server)', () => {
  it('dayOfWeekForDateStr: Monday=0, Sunday=6', () => {
    expect(dayOfWeekForDateStr('2026-07-20')).toBe(0); // Monday
    expect(dayOfWeekForDateStr('2026-07-19')).toBe(6); // Sunday
    expect(dayOfWeekForDateStr('2026-07-21')).toBe(1); // Tuesday
  });

  it('toMinutes converts HH:mm to minutes', () => {
    expect(toMinutes('10:30')).toBe(630);
    expect(toMinutes('00:00')).toBe(0);
  });

  it('getAcademyNow returns Asia/Baku local parts (UTC+4)', () => {
    // 2026-07-19T20:00Z → Baku 2026-07-20 00:00 (Monday)
    const p = getAcademyNow(new Date('2026-07-19T20:00:00Z'));
    expect(p.dateStr).toBe('2026-07-20');
    expect(p.hour).toBe(0);
    expect(p.minute).toBe(0);
    expect(p.dayOfWeek).toBe(0);
  });

  it('academyDateStr formats a Date in Asia/Baku', () => {
    expect(academyDateStr(new Date('2026-07-19T20:00:00Z'))).toBe('2026-07-20');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/utils/academyTime.test.js`
Expected: FAIL — `Cannot find module '../../utils/academyTime.js'`.

- [ ] **Step 3: Write the implementation**

`server/utils/academyTime.js`:
```js
const ACADEMY_TZ = () => process.env.ACADEMY_TIMEZONE || 'Asia/Baku';

// Academy-local "now". dayOfWeek uses project convention: 0=Monday .. 6=Sunday.
export function getAcademyNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ(),
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // some ICU builds emit "24" at midnight
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour,
    minute: Number(get('minute')),
    dayOfWeek: dayMap[get('weekday')] ?? 0,
  };
}

// Weekday (0=Monday .. 6=Sunday) for a "YYYY-MM-DD" string.
export function dayOfWeekForDateStr(dateStr) {
  const jsDay = new Date(`${dateStr}T12:00:00Z`).getUTCDay(); // 0=Sun .. 6=Sat
  return (jsDay + 6) % 7;
}

// Format a Date as "YYYY-MM-DD" in Asia/Baku.
export function academyDateStr(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ(),
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run test/utils/academyTime.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add server/utils/academyTime.js server/test/utils/academyTime.test.js
git commit -m "feat(server): add Asia/Baku academy-time helpers"
```

---

## Task 2: Meeting model

**Files:**
- Create: `server/models/Meeting.js`

- [ ] **Step 1: Write the implementation** (declarative model — no separate unit test; covered by Task 3 idempotency test)

`server/models/Meeting.js`:
```js
import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String },
    occurrenceDate: { type: String, required: true }, // "YYYY-MM-DD" (Asia/Baku)
    roomName: { type: String, required: true, unique: true }, // "cahanacademy-<uuid>"
    startTime: { type: String },
    endTime: { type: String },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// One meeting room per (schedule occurrence).
meetingSchema.index({ schedule: 1, occurrenceDate: 1 }, { unique: true });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `cd server && node --input-type=module -e "import('./models/Meeting.js').then(()=>console.log('ok'))"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**

```bash
git add server/models/Meeting.js
git commit -m "feat(server): add Meeting model for online class occurrences"
```

---

## Task 3: join-or-create endpoint + route + wiring

**Files:**
- Create: `server/controllers/meetingController.js`
- Create: `server/routes/meetingRoutes.js`
- Modify: `server/server.js`
- Test: `server/test/routes/meetingRoutes.test.js`

- [ ] **Step 1: Write the failing test**

`server/test/routes/meetingRoutes.test.js`:
```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import meetingRoutes from '../../routes/meetingRoutes.js';
import Schedule from '../../models/Schedule.js';
import User from '../../models/userModel.js';
import Group from '../../models/Group.js';
import Meeting from '../../models/Meeting.js';
import { errorHandler } from '../../middleware/errorMiddleware.js';

const app = express();
app.use(express.json());
app.use('/api/meetings', meetingRoutes);
app.use(errorHandler);

const token = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Meeting API', () => {
  let teacher, student, outsider, admin, group, schedule;

  beforeEach(async () => {
    // Fake ONLY Date so real timers/IO (mongoose, supertest) keep working.
    vi.useFakeTimers({ toFake: ['Date'] });
    // 2026-07-20 06:30Z = 10:30 Asia/Baku (Monday), inside 10:00–12:00.
    vi.setSystemTime(new Date('2026-07-20T06:30:00Z'));

    teacher = await User.create({ name: 'T', email: 't@x.com', password: 'Password1', role: 'teacher', status: 'active' });
    student = await User.create({ name: 'S', email: 's@x.com', password: 'Password1', role: 'student', status: 'active' });
    outsider = await User.create({ name: 'O', email: 'o@x.com', password: 'Password1', role: 'student', status: 'active' });
    admin = await User.create({ name: 'A', email: 'a@x.com', password: 'Password1', role: 'admin', status: 'active' });
    group = await Group.create({ name: 'G', course: 'C', teacher: teacher._id, students: [student._id] });
    schedule = await Schedule.create({
      group: group._id, teacher: teacher._id, subject: 'Math',
      repetitionType: 'weekly', dayOfWeek: 0, startTime: '10:00', endTime: '12:00', type: 'online',
    });
  });

  afterEach(() => { vi.useRealTimers(); });

  const join = (tok, body = {}) =>
    request(app)
      .post(`/api/meetings/join-or-create/${schedule._id}`)
      .set('Authorization', `Bearer ${tok}`)
      .send(body);

  it('teacher joins and receives a room name + display name', async () => {
    const res = await join(token(teacher._id));
    expect(res.statusCode).toBe(200);
    expect(res.body.data.roomName).toMatch(/^cahanacademy-/);
    expect(res.body.data.displayName).toBe('T');
    expect(res.body.data.jitsiDomain).toBe('meet.jit.si');
  });

  it('student in the group can join', async () => {
    expect((await join(token(student._id))).statusCode).toBe(200);
  });

  it('admin can join', async () => {
    expect((await join(token(admin._id))).statusCode).toBe(200);
  });

  it('outsider is forbidden (403)', async () => {
    expect((await join(token(outsider._id))).statusCode).toBe(403);
  });

  it('rejects a non-online schedule (400)', async () => {
    schedule.type = 'offline';
    await schedule.save();
    expect((await join(token(teacher._id))).statusCode).toBe(400);
  });

  it('forbids joining before the window (403)', async () => {
    vi.setSystemTime(new Date('2026-07-20T03:00:00Z')); // 07:00 Baku, before 09:50
    expect((await join(token(teacher._id))).statusCode).toBe(403);
  });

  it('is idempotent: same occurrence → same room, one Meeting doc', async () => {
    const r1 = await join(token(teacher._id));
    const r2 = await join(token(student._id));
    expect(r1.body.data.roomName).toBe(r2.body.data.roomName);
    expect(await Meeting.countDocuments({ schedule: schedule._id })).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run test/routes/meetingRoutes.test.js`
Expected: FAIL — cannot find `../../routes/meetingRoutes.js`.

- [ ] **Step 3: Write the controller**

`server/controllers/meetingController.js`:
```js
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
```

- [ ] **Step 4: Write the route**

`server/routes/meetingRoutes.js`:
```js
import express from 'express';
import { joinOrCreateMeeting, leaveMeeting } from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/join-or-create/:scheduleId', joinOrCreateMeeting);
router.post('/:id/leave', leaveMeeting);

export default router;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npx vitest run test/routes/meetingRoutes.test.js`
Expected: PASS (7 tests).

- [ ] **Step 6: Wire the route into the app**

In `server/server.js`, add the import next to the other route imports (after line importing `scheduleRoutes`):
```js
import meetingRoutes from './routes/meetingRoutes.js';
```
And register it next to the other `app.use('/api/...')` lines (after the `schedule` line):
```js
app.use('/api/meetings', meetingRoutes);
```

- [ ] **Step 7: Verify the full server test suite still passes**

Run: `cd server && npm test`
Expected: all suites PASS.

- [ ] **Step 8: Commit**

```bash
git add server/controllers/meetingController.js server/routes/meetingRoutes.js server/server.js server/test/routes/meetingRoutes.test.js
git commit -m "feat(server): add join-or-create + leave meeting endpoints"
```

---

## Task 4: Client academy-time + join-window logic

**Files:**
- Create: `client/src/utils/academyTime.js`
- Test: `client/src/utils/academyTime.test.js`

- [ ] **Step 1: Write the failing test**

`client/src/utils/academyTime.test.js`:
```js
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { getAcademyNow, joinWindowState } from './academyTime.js';

describe('academyTime (client)', () => {
  it('getAcademyNow maps to Asia/Baku (Monday=0)', () => {
    const p = getAcademyNow(new Date('2026-07-19T20:00:00Z')); // Baku 2026-07-20 00:00
    expect(p.dateStr).toBe('2026-07-20');
    expect(p.hour).toBe(0);
    expect(p.dayOfWeek).toBe(0);
  });

  const weekly = { type: 'online', repetitionType: 'weekly', dayOfWeek: 0, startTime: '10:00', endTime: '12:00' };

  it('shows join from 10 minutes before start until end', () => {
    // Baku Monday 09:55 → inside (start-10 = 09:50)
    expect(joinWindowState(weekly, new Date('2026-07-20T05:55:00Z')).show).toBe(true);
    // Baku 09:40 → before window
    expect(joinWindowState(weekly, new Date('2026-07-20T05:40:00Z')).show).toBe(false);
    // Baku 12:30 → after window
    expect(joinWindowState(weekly, new Date('2026-07-20T08:30:00Z')).show).toBe(false);
  });

  it('returns the occurrence date when shown', () => {
    const s = joinWindowState(weekly, new Date('2026-07-20T06:00:00Z'));
    expect(s.show).toBe(true);
    expect(s.occurrenceDate).toBe('2026-07-20');
  });

  it('hides for offline classes', () => {
    const offline = { ...weekly, type: 'offline' };
    expect(joinWindowState(offline, new Date('2026-07-20T06:00:00Z')).show).toBe(false);
  });

  it('hides when the weekday does not match', () => {
    // 2026-07-21 is Tuesday (dayOfWeek 1) but entry is Monday (0)
    expect(joinWindowState(weekly, new Date('2026-07-21T06:00:00Z')).show).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/utils/academyTime.test.js`
Expected: FAIL — cannot find `./academyTime.js`.

- [ ] **Step 3: Write the implementation**

`client/src/utils/academyTime.js`:
```js
const ACADEMY_TZ = import.meta.env.VITE_ACADEMY_TIMEZONE || 'Asia/Baku';
const JOIN_EARLY_MINUTES = 10;

// Academy-local "now". dayOfWeek: 0=Monday .. 6=Sunday (project convention).
export function getAcademyNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour,
    minute: Number(get('minute')),
    dayOfWeek: dayMap[get('weekday')] ?? 0,
  };
}

export function academyDateStr(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

// { show, occurrenceDate } — whether the "Join" button is active for an online entry.
export function joinWindowState(entry, now = new Date()) {
  if (!entry || entry.type !== 'online') return { show: false, occurrenceDate: null };
  const a = getAcademyNow(now);
  let occurrenceDate;
  if (entry.repetitionType === 'once' && entry.specificDate) {
    occurrenceDate = academyDateStr(entry.specificDate);
    if (occurrenceDate !== a.dateStr) return { show: false, occurrenceDate };
  } else if (entry.dayOfWeek !== undefined && entry.dayOfWeek !== null) {
    if (entry.dayOfWeek !== a.dayOfWeek) return { show: false, occurrenceDate: a.dateStr };
    occurrenceDate = a.dateStr;
  } else {
    return { show: false, occurrenceDate: null };
  }
  const nowMin = a.hour * 60 + a.minute;
  const startMin = toMinutes(entry.startTime) - JOIN_EARLY_MINUTES;
  const endMin = toMinutes(entry.endTime);
  return { show: nowMin >= startMin && nowMin <= endMin, occurrenceDate };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && npx vitest run src/utils/academyTime.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/utils/academyTime.js client/src/utils/academyTime.test.js
git commit -m "feat(client): add academy-time join-window logic"
```

---

## Task 5: RTK Query meetings API

**Files:**
- Create: `client/src/features/meetings/meetingsApi.js`
- Modify: `client/src/app/api/apiSlice.js`

- [ ] **Step 1: Add the `'Meeting'` tag type**

In `client/src/app/api/apiSlice.js`, add `'Meeting'` to the `tagTypes` array (after `'Payment'`).

- [ ] **Step 2: Write the API slice**

`client/src/features/meetings/meetingsApi.js`:
```js
import { apiSlice } from '../../app/api/apiSlice';

export const meetingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    joinOrCreateMeeting: builder.mutation({
      query: ({ scheduleId, date }) => ({
        url: `/meetings/join-or-create/${scheduleId}`,
        method: 'POST',
        body: date ? { date } : {},
      }),
      transformResponse: (response) => response.data,
    }),
    leaveMeeting: builder.mutation({
      query: (meetingId) => ({
        url: `/meetings/${meetingId}/leave`,
        method: 'POST',
      }),
    }),
  }),
});

export const { useJoinOrCreateMeetingMutation, useLeaveMeetingMutation } = meetingsApi;
```

- [ ] **Step 3: Verify the client build compiles**

Run: `cd client && npx vite build`
Expected: build succeeds (no import errors).

- [ ] **Step 4: Commit**

```bash
git add client/src/features/meetings/meetingsApi.js client/src/app/api/apiSlice.js
git commit -m "feat(client): add meetings RTK Query endpoints"
```

---

## Task 6: JoinClassButton + Schedule integration

**Files:**
- Create: `client/src/components/schedule/JoinClassButton.jsx`
- Modify: `client/src/pages/schedule/Schedule.jsx`

- [ ] **Step 1: Write the component**

`client/src/components/schedule/JoinClassButton.jsx`:
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video } from 'lucide-react';
import { joinWindowState } from '../../utils/academyTime';

export default function JoinClassButton({ entry }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState(() => joinWindowState(entry));

  useEffect(() => {
    const tick = () => setState(joinWindowState(entry));
    tick();
    const id = setInterval(tick, 30000); // re-evaluate every 30s so the button appears when class starts
    return () => clearInterval(id);
  }, [entry]);

  if (entry?.type !== 'online' || !state.show) return null;

  const handleJoin = () => {
    const qs = state.occurrenceDate ? `?date=${state.occurrenceDate}` : '';
    navigate(`/meeting/${entry._id}${qs}`);
  };

  return (
    <button
      onClick={handleJoin}
      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-[11px] rounded-md font-medium transition-colors"
    >
      <Video size={12} />
      {t('schedule.join')}
    </button>
  );
}
```

Note: `Video` is a standard lucide-react icon. If the pinned lucide-react version lacks it, substitute `Play` (also present) — verify by `cd client && npx vite build` in Step 3.

- [ ] **Step 2: Integrate into Schedule.jsx**

In `client/src/pages/schedule/Schedule.jsx`, add the import near the other imports (after the `Spinner` import):
```jsx
import JoinClassButton from '../../components/schedule/JoinClassButton';
```
Then render the button inside each entry card. Locate the badges block that ends right before the note paragraph:
```jsx
                          </div>
                          {entry.note && (
```
Insert the button between the closing `</div>` of the badges row and the note line so it becomes:
```jsx
                          </div>
                          <JoinClassButton entry={entry} />
                          {entry.note && (
```

- [ ] **Step 3: Verify build compiles**

Run: `cd client && npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Run the client tests (nothing should break)**

Run: `cd client && npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/schedule/JoinClassButton.jsx client/src/pages/schedule/Schedule.jsx
git commit -m "feat(client): add JoinClassButton to schedule for online classes"
```

---

## Task 7: MeetingRoom page + route

**Files:**
- Create: `client/src/pages/meeting/MeetingRoom.jsx`
- Modify: `client/src/App.jsx`

- [ ] **Step 1: Write the MeetingRoom page**

`client/src/pages/meeting/MeetingRoom.jsx`:
```jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Spinner from '../../components/common/Spinner';
import {
  useJoinOrCreateMeetingMutation,
  useLeaveMeetingMutation,
} from '../../features/meetings/meetingsApi';

// Toolbar without recording/livestreaming buttons.
const TOOLBAR_BUTTONS = [
  'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection',
  'hangup', 'chat', 'raisehand', 'participants-pane', 'tileview',
  'select-background', 'settings',
];

function loadJitsiScript(domain) {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve(window.JitsiMeetExternalAPI);
    const src = `https://${domain}/external_api.js`;
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.JitsiMeetExternalAPI));
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(window.JitsiMeetExternalAPI);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function MeetingRoom() {
  const { scheduleId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const meetingIdRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const [joinOrCreate] = useJoinOrCreateMeetingMutation();
  const [leaveMeeting] = useLeaveMeetingMutation();

  useEffect(() => {
    let disposed = false;

    (async () => {
      try {
        const date = searchParams.get('date') || undefined;
        const data = await joinOrCreate({ scheduleId, date }).unwrap();
        if (disposed) return;
        meetingIdRef.current = data.meetingId;

        const JitsiMeetExternalAPI = await loadJitsiScript(data.jitsiDomain);
        if (disposed || !containerRef.current) return;

        const api = new JitsiMeetExternalAPI(data.jitsiDomain, {
          roomName: data.roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: data.displayName, email: data.email },
          configOverwrite: {
            prejoinPageEnabled: true,
            prejoinConfig: { enabled: true },
            disableDeepLinking: true,
            disableThirdPartyRequests: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS,
            SHOW_JITSI_WATERMARK: false,
          },
        });
        apiRef.current = api;
        setReady(true);

        const goBack = () => {
          if (meetingIdRef.current) leaveMeeting(meetingIdRef.current);
          navigate('/schedule');
        };
        api.addEventListener('readyToClose', goBack);
        api.addEventListener('videoConferenceLeft', goBack);
      } catch (err) {
        if (disposed) return;
        const msg = err?.data?.message || t('meeting.joinFailed');
        setError(msg);
        toast.error(msg);
        setTimeout(() => navigate('/schedule'), 1500);
      }
    })();

    return () => {
      disposed = true;
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* ignore */ }
        apiRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleId]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `client/src/App.jsx`, add the lazy import next to the other page imports:
```jsx
const MeetingRoom = lazy(() => import('./pages/meeting/MeetingRoom'));
```
Then add the route **inside `<Route element={<ProtectedRoute />}>` but before `<Route element={<AppLayout />}>`** so it renders full-screen without the sidebar:
```jsx
          <Route element={<ProtectedRoute />}>
            <Route path="/meeting/:scheduleId" element={<MeetingRoom />} />
            <Route element={<AppLayout />}>
```

- [ ] **Step 3: Verify build compiles**

Run: `cd client && npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/meeting/MeetingRoom.jsx client/src/App.jsx
git commit -m "feat(client): add full-screen Jitsi MeetingRoom page and route"
```

---

## Task 8: i18n strings

**Files:**
- Modify: `client/src/i18n/locales/az.json`
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/ru.json`

- [ ] **Step 1: Add the `schedule.join` key and a `meeting` object to each locale**

In `az.json` — add `"join": "Qoşul"` inside the existing `"schedule"` object, and add a top-level `"meeting"` object:
```json
  "meeting": {
    "joinFailed": "Görüşə qoşulmaq mümkün olmadı",
    "connecting": "Qoşulur..."
  }
```

In `en.json` — inside `"schedule"`: `"join": "Join"`; top-level:
```json
  "meeting": {
    "joinFailed": "Could not join the meeting",
    "connecting": "Connecting..."
  }
```

In `ru.json` — inside `"schedule"`: `"join": "Присоединиться"`; top-level:
```json
  "meeting": {
    "joinFailed": "Не удалось присоединиться к встрече",
    "connecting": "Подключение..."
  }
```

(If a `"meeting"` key already exists, merge these sub-keys into it instead of duplicating.)

- [ ] **Step 2: Verify each JSON file is valid**

Run: `cd client && node -e "['az','en','ru'].forEach(l=>{JSON.parse(require('fs').readFileSync('src/i18n/locales/'+l+'.json','utf8'));console.log(l,'ok')})"`
Expected: `az ok`, `en ok`, `ru ok`.

- [ ] **Step 3: Commit**

```bash
git add client/src/i18n/locales/az.json client/src/i18n/locales/en.json client/src/i18n/locales/ru.json
git commit -m "feat(client): add i18n strings for join button and meeting page"
```

---

## Task 9: Environment variables & docs

**Files:**
- Modify: `server/.env.example`
- Modify: `client/.env.example`
- Modify: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Add server env vars**

Append to `server/.env.example`:
```env
# Meeting / Jitsi
ACADEMY_TIMEZONE=Asia/Baku
JITSI_DOMAIN=meet.jit.si
```

- [ ] **Step 2: Add client env var**

Append to `client/.env.example`:
```env
# Meeting timezone for the "Join" button window (defaults to Asia/Baku)
VITE_ACADEMY_TIMEZONE=Asia/Baku
```

- [ ] **Step 3: Document in DEPLOYMENT.md**

In `docs/DEPLOYMENT.md`, in the backend environment variables block (section 4), add these two lines near the other backend vars:
```env
ACADEMY_TIMEZONE=Asia/Baku
JITSI_DOMAIN=meet.jit.si
```

- [ ] **Step 4: Commit**

```bash
git add server/.env.example client/.env.example docs/DEPLOYMENT.md
git commit -m "docs: document ACADEMY_TIMEZONE and JITSI_DOMAIN env vars"
```

---

## Task 10: Full verification

- [ ] **Step 1: Run backend test suite**

Run: `cd server && npm test`
Expected: all suites PASS (including the new `academyTime` and `meetingRoutes` tests).

- [ ] **Step 2: Run client test suite**

Run: `cd client && npm test`
Expected: all tests PASS.

- [ ] **Step 3: Manual smoke test (Jitsi embed can't be unit-tested)**

1. `npm run dev` (root) → client on `:5173`, server on `:5000`.
2. As **admin**, create/ensure an **online** schedule entry whose day/time window **includes now** (Asia/Baku). Set startTime a few minutes ahead so the −10min window is active.
3. Open **Schedule** page → the green **"Qoşul"** button appears on that entry.
4. Click it → routes to `/meeting/:scheduleId?date=...` → Jitsi **prejoin** screen (mic/camera selection) appears → join → video room loads. Confirm **no recording button** in the toolbar.
5. Log in as a **student in that group** (separate browser/incognito) → same button → joins the **same room** (both see each other).
6. Log in as a **student NOT in that group** → button does not appear (and direct navigation to the meeting URL returns to schedule with an error toast).
7. Leave the meeting (hangup) → returns to `/schedule`.

- [ ] **Step 4: Confirm results honestly**

Record the actual outcome of each smoke step. If any step fails, debug before considering the feature complete.

---

## Self-Review qeydləri (plan müəllifindən)

- **Spec əhatəsi:** Jitsi embed (Task 7) · join-or-create + access/time (Task 3) · Meeting model (Task 2) · join button 10-dəq pəncərə (Task 4, 6) · prejoin (Task 7) · Asia/Baku (Task 1, 4) · i18n (Task 8) · env (Task 9) · testlər (Task 1, 3, 4) · recording yox (Task 7 toolbar). Hamısı əhatə olunub.
- **Məhdudiyyət:** `meet.jit.si`-də moderator = ilk qoşulan; Jitsi embed unit-test edilmir (Task 10 manual smoke). Bu, spec-də dürüst qeyd olunub.
- **Tip uyğunluğu:** server və client `academyTime` eyni API-ni (`getAcademyNow`, `dayOfWeek` 0=B.e) paylaşır; controller cavabındakı `roomName/displayName/jitsiDomain/meetingId/email` sahələri `MeetingRoom.jsx` və `meetingsApi.js` ilə uyğundur.
