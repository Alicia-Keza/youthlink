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

module.exports = router;
