import { Navigate } from 'react-router-dom';
import { hasValidToken, clearSession } from '../utils/auth';

function ProtectedRoute({ children }) {
  if (!hasValidToken()) {
    clearSession();
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
