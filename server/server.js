import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import homeworkRoutes from './routes/homeworkRoutes.js';
import classworkRoutes from './routes/classworkRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import examRoutes from './routes/examRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import seedAdmin from './scripts/seedAdmin.js';

dotenv.config();

// ------------------------------------------------------------
// Database & seed data
// ------------------------------------------------------------
connectDB();
seedAdmin();

const app = express();

// ------------------------------------------------------------
// Core middle‑wares
// ------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// ------------------------------------------------------------
// CORS configuration
// ------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://cahan-academy-dashboard.vercel.app',  // ← hardcode əlavə et
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non‑browser requests (no origin)
      if (!origin) return callback(null, true);

      // Production mode – only allow the explicit CLIENT_URL.
      if (process.env.NODE_ENV === 'production') {
        const prodOrigin = process.env.CLIENT_URL;
        // If CLIENT_URL is missing we fall back to allowing any origin
        // (ideally it should always be set in production)
        if (!prodOrigin || prodOrigin === '*' || prodOrigin === origin) {
          return callback(null, true);
        }
      }

      // Development mode – whitelist array
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  })
);

// ------------------------------------------------------------
// Security – NoSQL injection sanitiser (Express 5 compatible)
// ------------------------------------------------------------
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          sanitize(obj[key]);
        }
      }
    }
    return obj;
  };
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
});

// ------------------------------------------------------------
// Logging (development only)
// ------------------------------------------------------------
if (process.env.NODE_ENV === 'development') {
  morgan.token('body', (req) => {
    const body = { ...req.body };
    if (body.password) body.password = '***';
    if (body.token) body.token = '***';
    if (body.refreshToken) body.refreshToken = '***';
    return JSON.stringify(body);
  });
  app.use(
    morgan(
      ':method :url :status :response-time ms - :res[content-length] :body'
    )
  );
}

// ------------------------------------------------------------
// Rate limiting
// ------------------------------------------------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
});
app.use('/api', limiter);

// ------------------------------------------------------------
// API routes (all prefixed with /api)
// ------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/classworks', classworkRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/payments', paymentRoutes);

// ------------------------------------------------------------
// Root route & error handling
// ------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('Cahan Academy API is running...');
});

app.use(notFound);
app.use(errorHandler);

// ------------------------------------------------------------
// Server start (only when run directly)
// ------------------------------------------------------------
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
}

export default app;