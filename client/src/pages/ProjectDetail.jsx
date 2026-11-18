import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { PROJECT_STAGES } from '../constants';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  function loadProject() {
    api(`/projects/${id}`)
      .then((data) => setProject(data.project))
      .catch((err) => setError(err.message));
  }

  useEffect(loadProject, [id]);

  // Mentors and investors leave feedback for the team
  async function sendFeedback(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/projects/${id}/feedback`, { method: 'POST', body: { comment } });
      setProject({ ...project, feedback: data.feedback });
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  }

  // Investors can show or remove their interest in investing
  async function toggleInterest() {
    setError('');
    try {
      await api(`/projects/${id}/interest`, { method: project.interested ? 'DELETE' : 'POST' });
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditing() {
    setForm({ title: project.title, description: project.description });
    setEditing(true);
  }

  async function saveProject(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api(`/projects/${id}`, { method: 'PUT', body: form });
      // Keep canEdit, the update response does not include it
      setProject({ ...project, ...data.project });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStage(e) {
    setError('');
    try {
      const data = await api(`/projects/${id}/stage`, { method: 'PUT', body: { stage: e.target.value } });
      setProject({ ...project, ...data.project });
    } catch (err) {
      setError(err.message);
    }
  }

  if (!project) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading...</p>;
  }

  return (
    <div>
      <h1>{project.title}</h1>
      <p>
        <span className="stage">{project.stage}</span>
      </p>
      {error && <p className="error">{error}</p>}

      {editing ? (
        <form className="card form" onSubmit={saveProject}>
          <h2>Edit project</h2>
          <label>
            Project title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            What is the project about?
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="row">
            <button className="button" type="submit">Save changes</button>
            <button className="button secondary" type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <section className="card">
          <h2>About the project</h2>
          {project.description ? <p>{project.description}</p> : <p className="muted">No description yet.</p>}
          <p className="muted">
            Team: {project.canEdit ? <Link to={`/teams/${project.teamId}`}>{project.teamName}</Link> : project.teamName}
          </p>
          {project.canEdit && (
            <button className="button secondary" onClick={startEditing}>
              Edit project
            </button>
          )}
        </section>
      )}

      <section className="card">
        <h2>Investment</h2>
        <p className="muted">
          {project.interestCount === 1
            ? '1 investor is interested in this project.'
            : `${project.interestCount} investors are interested in this project.`}
        </p>
        {project.canEdit && project.investors.length > 0 && (
          <ul className="list">
            {project.investors.map((investor) => (
              <li key={investor.id}>{investor.name}</li>
            ))}
          </ul>
        )}
        {user.role === 'investor' && (
          <button className={project.interested ? 'button secondary' : 'button'} onClick={toggleInterest}>
            {project.interested ? 'Remove my interest' : 'I am interested in investing'}
          </button>
        )}
      </section>

      <section className="card">
        <h2>Feedback</h2>
        {project.feedback.length === 0 && <p className="muted">No feedback yet.</p>}
        {project.feedback.map((item) => (
          <div className="request" key={item.id}>
            <p>{item.comment}</p>
            <p className="muted">
              {item.authorName} ({item.authorRole}), {new Date(item.createdAt + 'Z').toLocaleDateString()}
            </p>
          </div>
        ))}

        {(user.role === 'mentor' || user.role === 'investor') && (
          <form className="form" onSubmit={sendFeedback}>
            <label>
              Give feedback to the team
              <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} required />
            </label>
            <button className="button" type="submit">Send feedback</button>
          </form>
        )}
      </section>

      {project.canEdit && (
        <section className="card form">
          <h2>Project stage</h2>
          <label>
            Move the project to a new stage as the team makes progress
            <select value={project.stage} onChange={changeStage}>
              {PROJECT_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </label>
        </section>
      )}
    </div>
  );
}
