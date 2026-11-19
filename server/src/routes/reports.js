const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Things that can be reported, and the table each one is saved in
const CONTENT_TABLES = { project: 'projects', feedback: 'feedback' };

// Any user can report a project or a piece of feedback as inappropriate
router.post('/', (req, res) => {
  const { contentType } = req.body;
  const contentId = Number(req.body.contentId);
  const reason = String(req.body.reason || '').trim();

  if (!CONTENT_TABLES[contentType]) {
    return res.status(400).json({ error: 'This content cannot be reported' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Please tell us why you are reporting this' });
  }
  if (reason.length > 500) {
    return res.status(400).json({ error: 'Reason must be 500 characters or less' });
  }

  const content = db.prepare(`SELECT id FROM ${CONTENT_TABLES[contentType]} WHERE id = ?`).get(contentId);
  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  const existing = db
    .prepare(
      "SELECT id FROM reports WHERE reporter_id = ? AND content_type = ? AND content_id = ? AND status = 'open'"
    )
    .get(req.user.id, contentType, contentId);
  if (existing) {
    return res.status(409).json({ error: 'You have already reported this' });
  }

  db.prepare('INSERT INTO reports (reporter_id, content_type, content_id, reason) VALUES (?, ?, ?, ?)').run(
    req.user.id,
    contentType,
    contentId,
    reason
  );

  res.status(201).json({ message: 'Thank you. The YouthLink team will review this.' });
});

module.exports = router;
