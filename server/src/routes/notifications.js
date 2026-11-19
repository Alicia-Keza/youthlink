const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// My latest notifications and how many are unread
router.get('/', (req, res) => {
  const notifications = db
    .prepare(
      `SELECT id, type, text, link, read_at AS readAt, created_at AS createdAt
       FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50`
    )
    .all(req.user.id);

  const unread = db
    .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .get(req.user.id).count;

  res.json({ notifications, unread });
});

router.put('/read-all', (req, res) => {
  db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(
    req.user.id
  );
  res.json({ unread: 0 });
});

router.put('/:id/read', (req, res) => {
  const result = db
    .prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ? AND read_at IS NULL")
    .run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
