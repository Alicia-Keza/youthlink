import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/projects/${id}`)
      .then((data) => setProject(data.project))
      .catch((err) => setError(err.message));
  }, [id]);

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

      <section className="card">
        <h2>About the project</h2>
        {project.description ? <p>{project.description}</p> : <p className="muted">No description yet.</p>}
        <p className="muted">
          Team: {project.canEdit ? <Link to={`/teams/${project.teamId}`}>{project.teamName}</Link> : project.teamName}
        </p>
      </section>
    </div>
  );
}
