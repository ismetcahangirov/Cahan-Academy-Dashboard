import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Layout and Route Guards (Keep these synchronous to prevent UI flashes)
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import RoleRoute from './components/RoleRoute';
import { ThemeProvider } from './context/ThemeContext';
import Spinner from './components/common/Spinner';

// Lazy-loaded Pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Users = lazy(() => import('./pages/users/Users'));
const Teachers = lazy(() => import('./pages/teachers/Teachers'));
const Students = lazy(() => import('./pages/students/Students'));
const Invitations = lazy(() => import('./pages/invitations/Invitations'));
const AcceptInvitation = lazy(() => import('./pages/invitations/AcceptInvitation'));
const Groups = lazy(() => import('./pages/groups/Groups'));
const Courses = lazy(() => import('./pages/courses/Courses'));
const Attendance = lazy(() => import('./pages/attendance/Attendance'));
const Homeworks = lazy(() => import('./pages/homeworks/Homeworks'));
const Classworks = lazy(() => import('./pages/classworks/Classworks'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Quizzes = lazy(() => import('./pages/quizzes/Quizzes'));
const Exams = lazy(() => import('./pages/exams/Exams'));
const Notifications = lazy(() => import('./pages/notifications/Notifications'));
const Schedule = lazy(() => import('./pages/schedule/Schedule'));
const UserDetail = lazy(() => import('./pages/users/UserDetail'));
const StudentDetail = lazy(() => import('./pages/students/StudentDetail'));
const TeacherDetail = lazy(() => import('./pages/teachers/TeacherDetail'));
const TakeExam = lazy(() => import('./pages/exams/TakeExam'));
const StudentPayments = lazy(() => import('./pages/payments/StudentPayments'));
const MeetingRoom = lazy(() => import('./pages/meeting/MeetingRoom'));

// Fallback Loading Component
const PageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <Spinner />
        <p className="text-[var(--muted-foreground)] text-sm font-medium animate-pulse">{t('common.loading')}</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: 'var(--card)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
          </Route>
 
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Full-screen meeting room (no sidebar) */}
            <Route path="/meeting/:scheduleId" element={<MeetingRoom />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
 
              {/* Admin only */}
              <Route element={<RoleRoute roles={['admin']} />}>
                <Route path="/users" element={<Users />} />
                <Route path="/users/:id" element={<UserDetail />} />
                <Route path="/invitations" element={<Invitations />} />
                <Route path="/students/:id/payments" element={<StudentPayments />} />
              </Route>
 
              {/* Admin + Teacher */}
              <Route element={<RoleRoute roles={['admin', 'teacher']} />}>
                <Route path="/teachers" element={<Teachers />} />
                <Route path="/teachers/:id" element={<TeacherDetail />} />
              </Route>
 
              {/* All authenticated users */}
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentDetail />} />
              <Route path="/groups" element={<Groups />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/homeworks" element={<Homeworks />} />
              <Route path="/classworks" element={<Classworks />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/:id/take" element={<RoleRoute roles={['student']}><TakeExam /></RoleRoute>} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/courses/:id" element={<div className="text-white p-6">Kurs Detalları (Tezliklə)</div>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
