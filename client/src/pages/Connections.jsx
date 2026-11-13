import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Connections() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  function loadConnections() {
    api('/connections')
      .then(setData)
      .catch((err) => setError(err.message));
  }

  useEffect(loadConnections, []);

  async function answer(connectionId, action) {
    setError('');
    try {
      await api(`/connections/${connectionId}/${action}`, { method: 'PUT' });
      loadConnections();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading...</p>;
  }

  return (
    <div>
      <h1>Connections</h1>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Requests received</h2>
        {data.incoming.length === 0 && <p className="muted">No new requests.</p>}
        <ul className="list">
          {data.incoming.map((item) => (
            <li key={item.id}>
              <span>{item.user.name} wants to connect with you</span>
              <span className="row">
                <button className="button" onClick={() => answer(item.id, 'accept')}>Accept</button>
                <button className="button secondary" onClick={() => answer(item.id, 'decline')}>Decline</button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Requests sent</h2>
        {data.outgoing.length === 0 && <p className="muted">You have no pending requests.</p>}
        <ul className="list">
          {data.outgoing.map((item) => (
            <li key={item.id}>
              <span>{item.user.name}</span>
              <span className="muted">Waiting for an answer</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>My connections</h2>
        {data.connected.length === 0 && (
          <p className="muted">
            You have no connections yet. Find people on the <Link to="/matches">matches page</Link>.
          </p>
        )}
        <ul className="list">
          {data.connected.map((item) => (
            <li key={item.id}>
              <span>{item.user.name}</span>
              <span className="muted">Connected</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
