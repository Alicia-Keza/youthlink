import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/profile/me'), api('/matches'), api('/connections'), api('/teams')])
      .then(([profile, matches, connections, teams]) => {
        setStats({
          hasSkills: profile.profile.skills.length > 0,
          matches: matches.matches.length,
          requests: connections.incoming.length,
          connections: connections.connected.length,
          teams: teams.teams.length,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      {error && <p className="error">{error}</p>}
      {!stats && !error && <p className="muted">Loading...</p>}

      {stats && !stats.hasSkills && (
        <p className="notice">
          You have not added any skills yet. <Link to="/profile">Complete your profile</Link> to get matches.
        </p>
      )}

      {stats && (
        <div className="grid">
          <Link to="/matches" className="card stat">
            <span className="stat-number">{stats.matches}</span>
            <span>Matches for you</span>
          </Link>
          <Link to="/connections" className="card stat">
            <span className="stat-number">{stats.requests}</span>
            <span>Requests waiting for your answer</span>
          </Link>
          <Link to="/connections" className="card stat">
            <span className="stat-number">{stats.connections}</span>
            <span>Connections</span>
          </Link>
          <Link to="/teams" className="card stat">
            <span className="stat-number">{stats.teams}</span>
            <span>Teams</span>
          </Link>
        </div>
      )}
    </div>
  );
}
