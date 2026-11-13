import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { SKILL_CATEGORIES } from '../constants';
import SkillTag from '../components/SkillTag';

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [connections, setConnections] = useState([]);
  const [newMemberId, setNewMemberId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api(`/teams/${id}`), api('/connections')])
      .then(([teamData, connectionData]) => {
        setTeam(teamData.team);
        setConnections(connectionData.connected.map((item) => item.user));
      })
      .catch((err) => setError(err.message));
  }, [id]);

  async function addMember(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/teams/${id}/members`, { method: 'POST', body: { userId: Number(newMemberId) } });
      setTeam(data.team);
      setNewMemberId('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function leaveTeam() {
    if (!window.confirm('Do you want to leave this team?')) {
      return;
    }
    try {
      await api(`/teams/${id}/members/me`, { method: 'DELETE' });
      navigate('/teams');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!team) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading...</p>;
  }

  // Skill coverage: which skill areas the team has and which are missing
  const teamSkills = team.members.flatMap((member) => member.skills);
  const areas = SKILL_CATEGORIES.filter((category) => category !== 'Other');
  const covered = areas.filter((category) => teamSkills.some((skill) => skill.category === category));
  const missing = areas.filter((category) => !covered.includes(category));

  const memberIds = team.members.map((member) => member.id);
  const canAdd = connections.filter((person) => !memberIds.includes(person.id));

  return (
    <div>
      <p>
        <Link to="/teams">Back to teams</Link>
      </p>
      <h1>{team.name}</h1>
      {team.description && <p>{team.description}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Skill coverage</h2>
        <p className="muted">
          The team covers {covered.length} of {areas.length} skill areas.
        </p>
        <div className="coverage">
          {covered.map((category) => (
            <span key={category} className="coverage-item covered">{category}: covered</span>
          ))}
          {missing.map((category) => (
            <span key={category} className="coverage-item missing">{category}: missing</span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Members</h2>
        <ul className="list">
          {team.members.map((member) => (
            <li key={member.id}>
              <span>{member.name}</span>
              <span className="tags">
                {member.skills.length === 0 && <span className="muted">No skills added</span>}
                {member.skills.map((skill) => (
                  <SkillTag key={skill.id} skill={skill} />
                ))}
              </span>
            </li>
          ))}
        </ul>

        {canAdd.length > 0 && (
          <form className="row" onSubmit={addMember}>
            <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} aria-label="Connection to add" required>
              <option value="">Choose a connection</option>
              {canAdd.map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
            <button className="button" type="submit">Add to team</button>
          </form>
        )}
      </section>

      <button className="button danger" onClick={leaveTeam}>Leave team</button>
    </div>
  );
}
