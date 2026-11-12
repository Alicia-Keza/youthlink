import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Only shows the page when the user is logged in
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
