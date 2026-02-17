import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();

  const hasRole = user?.roles?.some((r) => roles.includes(r));

  if (!hasRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
