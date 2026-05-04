import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Users from './pages/users/Users';
import Teachers from './pages/teachers/Teachers';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
  return (
    <>
      <Toaster 
        position="top-right" 
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            {/* Other protected routes will go here */}
            <Route path="/users" element={<Users />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/settings" element={<div className="text-white">Tənzimləmələr Səhifəsi (Tezliklə)</div>} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
