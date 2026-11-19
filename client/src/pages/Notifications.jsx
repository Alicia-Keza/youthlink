import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

function formatTime(createdAt) {
  return new Date(createdAt.replace(' ', 'T') + 'Z').toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Tells the navbar to check the unread count again
function refreshBell() {
  window.dispatchEvent(new Event('notifications-changed'));
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/notifications')
      .then((data) => setNotifications(data.notifications))
      .catch((err) => setError(err.message));
  }, []);

  // Mark the notification as read and open the page it is about
  async function openNotification(notification) {
    try {
      if (!notification.readAt) {
        await api(`/notifications/${notification.id}/read`, { method: 'PUT' });
      }
      navigate(notification.link || '/dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllRead() {
    try {
      await api('/notifications/read-all', { method: 'PUT' });
      setNotifications(notifications.map((item) => ({ ...item, readAt: item.readAt || 'now' })));
      refreshBell();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!notifications) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading...</p>;
  }

  const hasUnread = notifications.some((item) => !item.readAt);

  return (
    <div>
      <div className="row page-header">
        <h1>Notifications</h1>
        {hasUnread && (
          <button className="button secondary" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}

      <section className="card">
        {notifications.length === 0 && <p className="muted">You have no notifications yet.</p>}
        <ul className="list">
          {notifications.map((notification) => (
            <li key={notification.id} className={notification.readAt ? '' : 'unread'}>
              <button className="link-button notification" onClick={() => openNotification(notification)}>
                {notification.text}
              </button>
              <span className="muted">{formatTime(notification.createdAt)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
