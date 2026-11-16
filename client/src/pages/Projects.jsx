import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { PROJECT_STAGES } from '../constants';

// Public list of all projects, for other users, mentors and investors
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [stage, setStage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load again when the stage filter changes
  useEffect(() => {
    const query = stage ? `?stage=${encodeURIComponent(stage)}` : '';
    api(`/projects${query}`)
      .then((data) => setProjects(data.projects))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [stage]);

  return (
    <div>
      <h1>Projects</h1>
      <p className="muted">Projects that YouthLink teams are working on.</p>
      {error && <p className="error">{error}</p>}

      <div className="row">
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Filter by stage">
          <option value="">All stages</option>
          {PROJECT_STAGES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Loading...</p>}
      {!loading && projects.length === 0 && <p className="notice">No projects found.</p>}

      <div className="grid">
        {projects.map((project) => (
          <Link to={`/projects/${project.id}`} className="card" key={project.id}>
            <h3>{project.title}</h3>
            <p>
              <span className="stage">{project.stage}</span>
            </p>
            {project.description && <p>{project.description}</p>}
            <p className="muted">Team: {project.teamName}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
