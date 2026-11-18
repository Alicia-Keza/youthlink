import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

// Shows mentors the requests waiting for an answer and the teams they mentor
export default function MentorDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  function loadRequests() {
    api('/mentorship/requests')
      .then(setData)
      .catch((err) => setError(err.message));
  }

  useEffect(loadRequests, []);

  async function answer(requestId, action) {
    setError('');
    try {
      await api(`/mentorship/${requestId}/${action}`, { method: 'PUT' });
      loadRequests();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading...</p>;
  }

  return (
    <div>
      <h1>Mentoring</h1>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Requests from teams</h2>
        {data.pending.length === 0 && <p className="muted">No new requests.</p>}
        {data.pending.map((request) => (
          <div className="request" key={request.id}>
            <h3>{request.teamName}</h3>
            {request.message && <p>"{request.message}"</p>}
            {request.projects.length > 0 && (
              <p className="muted">Projects: {request.projects.map((project) => project.title).join(', ')}</p>
            )}
            <div className="row">
              <button className="button" onClick={() => answer(request.id, 'accept')}>Accept</button>
              <button className="button secondary" onClick={() => answer(request.id, 'decline')}>Decline</button>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Teams I mentor</h2>
        {data.accepted.length === 0 && <p className="muted">You are not mentoring any team yet.</p>}
        {data.accepted.map((request) => (
          <div className="request" key={request.id}>
            <h3>{request.teamName}</h3>
            {request.projects.length === 0 && <p className="muted">This team has no projects yet.</p>}
            <ul className="list">
              {request.projects.map((project) => (
                <li key={project.id}>
                  <Link to={`/projects/${project.id}`}>{project.title}</Link>
                  <span className="stage">{project.stage}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
