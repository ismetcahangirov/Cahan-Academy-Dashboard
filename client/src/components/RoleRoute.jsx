import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

/**
 * RoleRoute — Rol əsaslı routing komponenti.
 * 
 * İstifadəsi (App.jsx-də):
 *   <Route element={<RoleRoute roles={['admin']} />}>
 *     <Route path="/users" element={<Users />} />
 *   </Route>
 *
 * @param {string[]} roles - İcazə verilən rolların siyahısı (məs: ['admin', 'teacher'])
 * @param {string}   redirectTo - İcazə olmadıqda yönləndiriləcək URL (default: '/')
 */
const RoleRoute = ({ roles = [], redirectTo = '/' }) => {
  const user = useSelector(selectCurrentUser);

  // İstifadəçi login olmayıbsa login-ə yönləndir
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // İstifadəçinin rolu icazə verilən rollar arasındadırsa keç
  if (roles.length === 0 || roles.includes(user.role)) {
    return <Outlet />;
  }

  // İcazə yoxdursa göstərilən URL-ə yönləndir
  return <Navigate to={redirectTo} replace />;
};

export default RoleRoute;
