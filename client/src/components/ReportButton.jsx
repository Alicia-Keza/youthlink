import { useState } from 'react';
import { api } from '../api';

// Small "Report" link that opens a form to report inappropriate content.
// contentType is 'project' or 'feedback'.
export default function ReportButton({ contentType, contentId }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');

  async function sendReport(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api('/reports', { method: 'POST', body: { contentType, contentId, reason } });
      setSent(data.message);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }

  if (sent) {
    return <p className="muted">{sent}</p>;
  }

  if (!open) {
    return (
      <button className="link-button report-link" onClick={() => setOpen(true)}>
        Report
      </button>
    );
  }

  return (
    <form className="form report-form" onSubmit={sendReport}>
      {error && <p className="error">{error}</p>}
      <label>
        Why is this inappropriate?
        <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} required />
      </label>
      <div className="row">
        <button className="button danger" type="submit">Send report</button>
        <button className="button secondary" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}
