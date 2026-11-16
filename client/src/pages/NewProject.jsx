import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { PROJECT_STAGES } from '../constants';

// Form for a team to start a new project
export default function NewProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', stage: PROJECT_STAGES[0] });
  const [error, setError] = useState('');

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/projects', { method: 'POST', body: { ...form, teamId: Number(id) } });
      navigate(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <p>
        <Link to={`/teams/${id}`}>Back to team</Link>
      </p>
      <form className="card form" onSubmit={handleSubmit}>
        <h1>Start a project</h1>
        {error && <p className="error">{error}</p>}

        <label>
          Project title
          <input name="title" value={form.title} onChange={updateField} required />
        </label>
        <label>
          What is the project about?
          <textarea name="description" value={form.description} onChange={updateField} rows={4} />
        </label>
        <label>
          Stage
          <select name="stage" value={form.stage} onChange={updateField}>
            {PROJECT_STAGES.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>

        <button className="button" type="submit">Create project</button>
      </form>
    </div>
  );
}
