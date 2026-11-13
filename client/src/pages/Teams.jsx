import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', memberIds: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/teams'), api('/connections')])
      .then(([teamData, connectionData]) => {
        setTeams(teamData.teams);
        setConnections(connectionData.connected.map((item) => item.user));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function toggleMember(userId) {
    const selected = form.memberIds.includes(userId)
      ? form.memberIds.filter((id) => id !== userId)
      : [...form.memberIds, userId];
    setForm({ ...form, memberIds: selected });
  }

  async function createTeam(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/teams', { method: 'POST', body: form });
      setTeams([{ ...data.team, memberCount: data.team.members.length }, ...teams]);
      setForm({ name: '', description: '', memberIds: [] });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Teams</h1>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}

      {!loading && teams.length === 0 && <p className="muted">You are not in a team yet.</p>}
      <div className="grid">
        {teams.map((team) => (
          <Link to={`/teams/${team.id}`} className="card" key={team.id}>
            <h3>{team.name}</h3>
            {team.description && <p>{team.description}</p>}
            <p className="muted">{team.memberCount} members</p>
          </Link>
        ))}
      </div>

      <form className="card form" onSubmit={createTeam}>
        <h2>Form a new team</h2>
        {connections.length === 0 ? (
          <p className="muted">
            You need at least one connection to form a team. Find people on
            the <Link to="/matches">matches page</Link>.
          </p>
        ) : (
          <>
            <label>
              Team name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              What will the team work on?
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>

            <fieldset>
              <legend>Choose team members from your connections</legend>
              <div className="checkbox-list">
                {connections.map((person) => (
                  <label key={person.id} className="checkbox">
                    <input
                      type="checkbox"
                      checked={form.memberIds.includes(person.id)}
                      onChange={() => toggleMember(person.id)}
                    />
                    <span>{person.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button className="button" type="submit" disabled={form.memberIds.length === 0}>
              Create team
            </button>
          </>
        )}
      </form>
    </div>
  );
}
