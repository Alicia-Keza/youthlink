import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

// Only shows the page when the user is logged in
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  // Wait until the saved login has been checked, otherwise a logged in
  // user is sent to the login page every time the page is refreshed
  if (loading) {
    return <p className="muted">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
