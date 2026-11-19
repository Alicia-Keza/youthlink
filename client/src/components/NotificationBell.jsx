import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { api } from '../api';
import { connectSocket } from '../socket';

// Navbar link with the number of unread notifications
export default function NotificationBell() {
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  // Check the count again when the user moves to another page,
  // for example after reading notifications
  useEffect(() => {
    api('/notifications')
      .then((data) => setUnread(data.unread))
      .catch(() => setUnread(0));
  }, [location.pathname]);

  // Add one to the count as soon as a new notification arrives
  useEffect(() => {
    const socket = connectSocket();
    socket.on('notification', () => setUnread((count) => count + 1));
    return () => socket.disconnect();
  }, []);

  return (
    <NavLink to="/notifications" className="bell">
      Notifications
      {unread > 0 && (
        <span className="badge" aria-label={`${unread} unread`}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </NavLink>
  );
}
