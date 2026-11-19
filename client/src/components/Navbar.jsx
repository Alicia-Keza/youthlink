import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">YouthLink</Link>
      <nav>
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/matches">Matches</NavLink>
            <NavLink to="/connections">Connections</NavLink>
            <NavLink to="/teams">Teams</NavLink>
            <NavLink to="/projects">Projects</NavLink>
            <NavLink to="/messages">Messages</NavLink>
            <NotificationBell />
            {user.role === 'mentor' && <NavLink to="/mentoring">Mentoring</NavLink>}
            <NavLink to="/profile">Profile</NavLink>
            <button className="link-button" onClick={handleLogout}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Sign up</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
