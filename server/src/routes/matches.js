const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { getProfile } = require('../profiles');
const { findMatches } = require('../matching');
const { connectionStatus } = require('../connectionHelpers');

const router = express.Router();

// GET /api/matches?search=...&category=...
router.get('/', requireAuth, (req, res) => {
  const me = getProfile(req.user.id);
  const others = db
    .prepare("SELECT id FROM users WHERE role = 'youth' AND id != ? AND suspended_at IS NULL")
    .all(req.user.id)
    .map((row) => getProfile(row.id));

  let matches = findMatches(me, others);

  const category = req.query.category;
  if (category) {
    matches = matches.filter((match) => match.user.skills.some((skill) => skill.category === category));
  }

  const search = String(req.query.search || '').trim().toLowerCase();
  if (search) {
    matches = matches.filter((match) => {
      const text = [
        match.user.name,
        ...match.user.skills.map((skill) => skill.name),
        ...match.user.interests,
      ].join(' ');
      return text.toLowerCase().includes(search);
    });
  }

  matches = matches.map((match) => ({
    ...match,
    connectionStatus: connectionStatus(req.user.id, match.user.id),
  }));

  res.json({ matches });
});

module.exports = router;
