const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// All users with their role and whether they are suspended
router.get('/users', (req, res) => {
  const users = db
    .prepare(
      `SELECT id, name, email, role, suspended_at AS suspendedAt, created_at AS createdAt
       FROM users ORDER BY id DESC`
    )
    .all();

  res.json({ users });
});

// Suspend a user who breaks the rules. They can no longer log in or use the platform.
router.put('/users/:id/suspend', (req, res) => {
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Administrators cannot be suspended' });
  }

  db.prepare("UPDATE users SET suspended_at = datetime('now') WHERE id = ? AND suspended_at IS NULL").run(user.id);
  res.json({ message: 'User suspended' });
});

router.put('/users/:id/unsuspend', (req, res) => {
  const result = db.prepare('UPDATE users SET suspended_at = NULL WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ message: 'User can use YouthLink again' });
});

// Finds the reported project or feedback so the admin can read it before deciding.
// Returns null when the content has already been removed.
function getReportedContent(contentType, contentId) {
  if (contentType === 'project') {
    return db.prepare('SELECT id, title, description FROM projects WHERE id = ?').get(contentId) || null;
  }
  return (
    db
      .prepare(
        `SELECT f.id, f.comment, f.project_id AS projectId, u.name AS authorName
         FROM feedback f JOIN users u ON u.id = f.author_id WHERE f.id = ?`
      )
      .get(contentId) || null
  );
}

// Reports waiting for a decision (or all reports with ?status=all)
router.get('/reports', (req, res) => {
  const showAll = req.query.status === 'all';
  const reports = db
    .prepare(
      `SELECT r.id, r.content_type AS contentType, r.content_id AS contentId, r.reason, r.status,
              r.created_at AS createdAt, u.name AS reporterName
       FROM reports r LEFT JOIN users u ON u.id = r.reporter_id
       ${showAll ? '' : "WHERE r.status = 'open'"}
       ORDER BY r.id DESC`
    )
    .all()
    .map((report) => ({ ...report, content: getReportedContent(report.contentType, report.contentId) }));

  res.json({ reports });
});

function findOpenReport(req, res) {
  const report = db.prepare("SELECT * FROM reports WHERE id = ? AND status = 'open'").get(req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return null;
  }
  return report;
}

// Remove the reported content. Other open reports about the same content are closed too.
router.put('/reports/:id/remove', (req, res) => {
  const report = findOpenReport(req, res);
  if (!report) return;

  const table = report.content_type === 'project' ? 'projects' : 'feedback';
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(report.content_id);
  db.prepare(
    "UPDATE reports SET status = 'removed' WHERE content_type = ? AND content_id = ? AND status = 'open'"
  ).run(report.content_type, report.content_id);

  res.json({ message: 'The content has been removed' });
});

// The content is fine, keep it
router.put('/reports/:id/dismiss', (req, res) => {
  const report = findOpenReport(req, res);
  if (!report) return;

  db.prepare("UPDATE reports SET status = 'dismissed' WHERE id = ?").run(report.id);
  res.json({ message: 'Report dismissed' });
});

module.exports = router;
