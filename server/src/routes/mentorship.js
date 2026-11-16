const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { getProfile } = require('../profiles');
const { isMember } = require('../teamHelpers');

const router = express.Router();
router.use(requireAuth);

// Lists all mentors so a team can choose who to ask
router.get('/mentors', (req, res) => {
  const mentors = db
    .prepare("SELECT id FROM users WHERE role = 'mentor' ORDER BY name")
    .all()
    .map((row) => getProfile(row.id));

  res.json({ mentors });
});

// A team member asks a mentor to guide the team
router.post('/', (req, res) => {
  const teamId = Number(req.body.teamId);
  const mentorId = Number(req.body.mentorId);
  const message = String(req.body.message || '').trim();

  const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  if (!isMember(teamId, req.user.id)) {
    return res.status(403).json({ error: 'Only team members can request a mentor for this team' });
  }

  const mentor = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'mentor'").get(mentorId);
  if (!mentor) {
    return res.status(404).json({ error: 'Mentor not found' });
  }

  const existing = db
    .prepare("SELECT id FROM mentorship_requests WHERE team_id = ? AND mentor_id = ? AND status != 'declined'")
    .get(teamId, mentorId);
  if (existing) {
    return res.status(409).json({ error: 'Your team has already asked this mentor' });
  }

  const result = db
    .prepare('INSERT INTO mentorship_requests (team_id, mentor_id, message) VALUES (?, ?, ?)')
    .run(teamId, mentorId, message);

  res.status(201).json({ request: { id: result.lastInsertRowid, status: 'pending' } });
});

// The mentorship requests of a team, shown on the team page
router.get('/team/:teamId', (req, res) => {
  if (!isMember(req.params.teamId, req.user.id)) {
    return res.status(403).json({ error: 'Only team members can view these requests' });
  }

  const requests = db
    .prepare(
      `SELECT r.id, r.status, r.message, r.created_at AS createdAt, u.id AS mentorId, u.name AS mentorName
       FROM mentorship_requests r JOIN users u ON u.id = r.mentor_id
       WHERE r.team_id = ? ORDER BY r.id DESC`
    )
    .all(req.params.teamId);

  res.json({ requests });
});

module.exports = router;
