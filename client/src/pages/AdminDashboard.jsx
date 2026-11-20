import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

// Shows what was reported, so the admin can read it before deciding
function ReportedContent({ report }) {
  if (!report.content) {
    return <p className="muted">This content has already been removed.</p>;
  }
  if (report.contentType === 'project') {
    return (
      <p>
        Project: <Link to={`/projects/${report.content.id}`}>{report.content.title}</Link>
        {report.content.description && <span className="muted"> {report.content.description}</span>}
      </p>
    );
  }
  return (
    <p>
      Feedback by {report.content.authorName}: "{report.content.comment}"{' '}
      <Link to={`/projects/${report.content.projectId}`}>Open project</Link>
    </p>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function loadData() {
    Promise.all([api('/admin/users'), api('/admin/reports')])
      .then(([userData, reportData]) => {
        setUsers(userData.users);
        setReports(reportData.reports);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (user.role === 'admin') loadData();
  }, []);

  // action is 'suspend', 'unsuspend', 'remove' or 'dismiss'
  async function runAction(path, confirmText) {
    if (confirmText && !window.confirm(confirmText)) {
      return;
    }
    setMessage('');
    setError('');
    try {
      const data = await api(path, { method: 'PUT' });
      setMessage(data.message);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (user.role !== 'admin') {
    return <p className="error">Only administrators can open this page.</p>;
  }

  return (
    <div>
      <h1>Admin dashboard</h1>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h2>Reported content</h2>
        {reports.length === 0 && <p className="muted">There are no reports to review.</p>}
        {reports.map((report) => (
          <div className="request" key={report.id}>
            <ReportedContent report={report} />
            <p className="muted">
              Reported by {report.reporterName || 'a deleted user'}: "{report.reason}"
            </p>
            <div className="row">
              <button
                className="button danger"
                onClick={() => runAction(`/admin/reports/${report.id}/remove`, 'Remove this content for everyone?')}
              >
                Remove content
              </button>
              <button className="button secondary" onClick={() => runAction(`/admin/reports/${report.id}/dismiss`)}>
                Keep it
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>Users ({users.length})</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>{item.suspendedAt ? 'Suspended' : 'Active'}</td>
                  <td>
                    {item.role !== 'admin' &&
                      (item.suspendedAt ? (
                        <button
                          className="link-button"
                          onClick={() => runAction(`/admin/users/${item.id}/unsuspend`)}
                        >
                          Unsuspend
                        </button>
                      ) : (
                        <button
                          className="link-button"
                          onClick={() => runAction(`/admin/users/${item.id}/suspend`, `Suspend ${item.name}?`)}
                        >
                          Suspend
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
