import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

// A team chooses a mentor and sends a request with a short message
export default function FindMentor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/mentorship/mentors')
      .then((data) => setMentors(data.mentors))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function sendRequest(e) {
    e.preventDefault();
    setError('');
    try {
      await api('/mentorship', { method: 'POST', body: { teamId: Number(id), mentorId: selectedId, message } });
      navigate(`/teams/${id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <p>
        <Link to={`/teams/${id}`}>Back to team</Link>
      </p>
      <h1>Find a mentor</h1>
      <p className="muted">Choose a mentor who can guide your team and tell them what you need help with.</p>
      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading...</p>}
      {!loading && mentors.length === 0 && <p className="notice">There are no mentors on YouthLink yet.</p>}

      <div className="grid">
        {mentors.map((mentor) => (
          <div className={selectedId === mentor.id ? 'card selected' : 'card'} key={mentor.id}>
            <h3>{mentor.name}</h3>
            {mentor.expertise && (
              <p>
                <strong>Expertise:</strong> {mentor.expertise}
              </p>
            )}
            {mentor.focusAreas.length > 0 && (
              <p>
                <strong>Focus areas:</strong> {mentor.focusAreas.join(', ')}
              </p>
            )}
            {mentor.bio && <p className="muted">{mentor.bio}</p>}
            <button className="button secondary" onClick={() => setSelectedId(mentor.id)}>
              {selectedId === mentor.id ? 'Selected' : 'Choose this mentor'}
            </button>
          </div>
        ))}
      </div>

      {selectedId && (
        <form className="card form" onSubmit={sendRequest}>
          <h2>Send a request</h2>
          <label>
            What does your team need help with?
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
          </label>
          <button className="button" type="submit">Send request</button>
        </form>
      )}
    </div>
  );
}
