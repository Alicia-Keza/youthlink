import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { PROJECT_STAGES } from '../constants';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/projects/${id}`)
      .then((data) => setProject(data.project))
      .catch((err) => setError(err.message));
  }, [id]);

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
