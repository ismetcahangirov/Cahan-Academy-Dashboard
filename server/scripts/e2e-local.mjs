// Local end-to-end stack: throwaway in-memory MongoDB + seeded demo data + API on PORT (default 5000).
// Never point this at a real database. Usage: `npm run e2e:local`, then start the client with
// VITE_API_URL=http://localhost:5000/api npm run dev
import crypto from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();

// Explicit local env. dotenv never overrides a key that is already set (even to ''),
// so nothing from a developer's server/.env (real SMTP, Google, Jitsi, DB) leaks in.
Object.assign(process.env, {
  MONGO_URI: mongo.getUri('cahan-e2e'),
  NODE_ENV: 'development',
  PORT: process.env.PORT || '5000',
  JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_REFRESH_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ACADEMY_TIMEZONE: 'Asia/Baku',
  ADMIN_EMAIL: '',
  ADMIN_PASSWORD: '',
  EMAIL_HOST: '',
  EMAIL_PORT: '',
  EMAIL_USER: '',
  EMAIL_PASS: '',
  EMAIL_FROM: '',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  JITSI_DOMAIN: '',
  JITSI_JWT_APP_ID: '',
  JITSI_JWT_SECRET: '',
});

// Letters + digits only, so it also passes the app's password rule
const password = process.env.E2E_PASSWORD || `E2e${crypto.randomBytes(6).toString('hex')}`;

const { default: mongoose } = await import('mongoose');
await import('../server.js');
if (mongoose.connection.readyState !== 1) {
  await new Promise((resolve) => mongoose.connection.once('open', resolve));
}

const { default: User } = await import('../models/userModel.js');
const { default: Group } = await import('../models/Group.js');
const { default: Schedule } = await import('../models/Schedule.js');
const { default: Course } = await import('../models/Course.js');
const { default: Homework } = await import('../models/Homework.js');
const { default: Classwork } = await import('../models/Classwork.js');
const { default: Exam } = await import('../models/Exam.js');
const { default: Quiz } = await import('../models/Quiz.js');
const { default: Attendance } = await import('../models/Attendance.js');

const DAY = 24 * 60 * 60 * 1000;
const mkUser = (name, email, role) => User.create({ name, email, password, role, status: 'active' });

const admin = await mkUser('E2E Admin', 'admin@e2e.example.com', 'admin');
const teacher = await mkUser('E2E Teacher', 'teacher@e2e.example.com', 'teacher');
const student1 = await mkUser('E2E Student One', 'student1@e2e.example.com', 'student');
const student2 = await mkUser('E2E Student Two', 'student2@e2e.example.com', 'student');

// Schedule.dayOfWeek: 0 = Monday ... 6 = Sunday; always include today
const todayIdx = (new Date().getDay() + 6) % 7;
const days = [...new Set(['0', '2', '4', String(todayIdx)])];
const group = await Group.create({
  name: 'E2E Frontend Group',
  teacher: teacher._id,
  students: [student1._id, student2._id],
  course: 'Frontend',
  schedule: { repetitionType: 'weekly', days, startTime: '19:00', endTime: '21:00', type: 'online' },
  startDate: new Date(Date.now() - 30 * DAY),
});
for (const dayOfWeek of days.map(Number)) {
  await Schedule.create({
    group: group._id,
    subject: group.name,
    teacher: teacher._id,
    dayOfWeek,
    startTime: '19:00',
    endTime: '21:00',
    type: 'online',
    repetitionType: 'weekly',
  });
}

await Course.create({
  title: 'Frontend Development',
  description: 'HTML, CSS, JavaScript and React',
  category: 'Programming',
  instructor: teacher._id,
  status: 'published',
});

await Homework.create({
  title: 'E2E Homework: Landing page',
  description: 'Build a landing page and submit the repository link.',
  group: group._id,
  teacher: teacher._id,
  dueDate: new Date(Date.now() + 7 * DAY),
});

await Classwork.create({
  title: 'E2E Classwork: Flexbox',
  description: 'Recreate the layout from class.',
  group: group._id,
  teacher: teacher._id,
  dueDate: new Date(Date.now() + 2 * DAY),
});

await Exam.create({
  title: 'E2E Exam: JavaScript basics',
  description: 'Auto-graded and open-ended questions',
  group: group._id,
  teacher: teacher._id,
  date: new Date(),
  duration: 30,
  questions: [
    { text: 'Which keyword declares a block-scoped constant?', type: 'multiple-choice', options: ['var', 'const', 'function'], correctAnswer: '1', points: 1 },
    { text: 'typeof null === "object"', type: 'true-false', correctAnswer: 'true', points: 1 },
    { text: 'Explain the difference between let and var.', type: 'open-ended', points: 2 },
  ],
});

await Quiz.create({
  title: 'E2E Quiz: CSS',
  description: 'Quick CSS check',
  group: group._id,
  teacher: teacher._id,
  timeLimit: 10,
  questions: [
    { text: 'Which property makes a flex container?', type: 'multiple-choice', options: ['display: flex', 'flex: 1', 'position: flex'], correctAnswer: '0', points: 1 },
    { text: 'CSS stands for Cascading Style Sheets', type: 'true-false', correctAnswer: 'true', points: 1 },
    { text: 'When would you use CSS Grid instead of Flexbox?', type: 'open-ended', points: 2 },
  ],
});

for (const daysAgo of [7, 2]) {
  const date = new Date(Date.now() - daysAgo * DAY);
  date.setUTCHours(0, 0, 0, 0);
  await Attendance.create({
    group: group._id,
    date,
    teacher: teacher._id,
    topic: `E2E lesson ${daysAgo} days ago`,
    records: [
      { student: student1._id, status: 'present' },
      { student: student2._id, status: daysAgo === 7 ? 'absent' : 'late' },
    ],
  });
}

console.log('\nE2E stack ready (in-memory DB, data is lost on exit)');
console.log(`  API:      http://localhost:${process.env.PORT}/api`);
console.log(`  Users:    ${[admin, teacher, student1, student2].map((u) => u.email).join(', ')}`);
console.log(`  Password: ${password}${process.env.E2E_PASSWORD ? ' (from E2E_PASSWORD)' : ' (random, set E2E_PASSWORD to fix it)'}`);

const shutdown = async () => {
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
