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

module.exports = router;
