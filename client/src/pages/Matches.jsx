import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { SKILL_CATEGORIES } from '../constants';
import SkillTag from '../components/SkillTag';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function loadMatches() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    api(`/matches?${params}`)
      .then((data) => setMatches(data.matches))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // Load again when the skill area filter changes
  useEffect(loadMatches, [category]);

  function handleSearch(e) {
    e.preventDefault();
    loadMatches();
  }

  async function connect(userId) {
    setError('');
    try {
      await api('/connections', { method: 'POST', body: { userId } });
      loadMatches();
    } catch (err) {
      setError(err.message);
    }
  }

  function connectButton(match) {
    if (match.connectionStatus === 'connected') {
      return <span className="muted">Connected</span>;
    }
    if (match.connectionStatus === 'request_sent') {
      return <span className="muted">Request sent</span>;
    }
    if (match.connectionStatus === 'request_received') {
      return <Link to="/connections">Wants to connect with you</Link>;
    }
    return (
      <button className="button" onClick={() => connect(match.user.id)}>
        Connect
      </button>
    );
  }

  return (
    <div>
      <h1>Matches</h1>
      <p className="muted">People whose skills complement yours, best match first.</p>
      {error && <p className="error">{error}</p>}

      <form className="row" onSubmit={handleSearch}>
        <input
          placeholder="Search by name, skill or interest"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by skill area">
          <option value="">All skill areas</option>
          {SKILL_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button className="button secondary" type="submit">Search</button>
      </form>

      {loading && <p className="muted">Loading...</p>}
      {!loading && matches.length === 0 && (
        <p className="notice">
          No matches found. Add your skills and choose the skills you are looking for on
          your <Link to="/profile">profile</Link>.
        </p>
      )}

      <div className="grid">
        {matches.map((match) => (
          <div className="card" key={match.user.id}>
            <h3>{match.user.name}</h3>
            {match.user.location && <p className="muted">{match.user.location}</p>}
            {match.user.bio && <p>{match.user.bio}</p>}

            <div className="tags">
              {match.user.skills.map((skill) => (
                <SkillTag key={skill.id} skill={skill} />
              ))}
            </div>

            {match.theyOffer.length > 0 && (
              <p>
                <strong>Can help you with:</strong> {match.theyOffer.join(', ')}
              </p>
            )}
            {match.iOffer.length > 0 && (
              <p>
                <strong>You can help with:</strong> {match.iOffer.join(', ')}
              </p>
            )}
            {match.sharedInterests.length > 0 && (
              <p>
                <strong>Shared interests:</strong> {match.sharedInterests.join(', ')}
              </p>
            )}

            {connectButton(match)}
          </div>
        ))}
      </div>
    </div>
  );
}
