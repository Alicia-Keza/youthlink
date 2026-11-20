const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { getProfile } = require('../profiles');
const { isMember, memberIds } = require('../teamHelpers');
const notify = require('../notify');

const router = express.Router();
router.use(requireAuth);

// Lists all mentors so a team can choose who to ask
router.get('/mentors', (req, res) => {
  const mentors = db
    .prepare("SELECT id FROM users WHERE role = 'mentor' AND suspended_at IS NULL ORDER BY name")
    .all()
    .map((row) => getProfile(row.id));

  res.json({ mentors });
});

// A team member asks a mentor to guide the team
router.post('/', (req, res) => {
  const teamId = Number(req.body.teamId);
  const mentorId = Number(req.body.mentorId);
  const message = String(req.body.message || '').trim();

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message must be 500 characters or less' });
  }

  const team = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(teamId);
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

  notify(mentorId, 'mentorship', `The team ${team.name} asked you to be their mentor`, '/mentoring');

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

// For the mentor dashboard: requests waiting for an answer and the teams being mentored
router.get('/requests', (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.status, r.message, r.created_at AS createdAt, t.id AS teamId, t.name AS teamName
       FROM mentorship_requests r JOIN teams t ON t.id = r.team_id
       WHERE r.mentor_id = ? AND r.status != 'declined' ORDER BY r.id DESC`
    )
    .all(req.user.id);

  // Show the projects of each team so the mentor can open them and give feedback
  const projectsOfTeam = db.prepare('SELECT id, title, stage FROM projects WHERE team_id = ? ORDER BY id DESC');
  const requests = rows.map((row) => ({ ...row, projects: projectsOfTeam.all(row.teamId) }));

  res.json({
    pending: requests.filter((request) => request.status === 'pending'),
    accepted: requests.filter((request) => request.status === 'accepted'),
  });
});

// Only the mentor who received a request can answer it
function answerRequest(status) {
  return (req, res) => {
    const result = db
      .prepare("UPDATE mentorship_requests SET status = ? WHERE id = ? AND mentor_id = ? AND status = 'pending'")
      .run(status, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Mentorship request not found' });
    }

    // Tell everyone in the team that the mentor said yes
    if (status === 'accepted') {
      const request = db.prepare('SELECT team_id FROM mentorship_requests WHERE id = ?').get(req.params.id);
      memberIds(request.team_id).forEach((userId) => {
        notify(userId, 'mentorship', `${req.user.name} accepted to mentor your team`, `/teams/${request.team_id}`);
      });
    }
    res.json({ request: { id: Number(req.params.id), status } });
  };
}

router.put('/:id/accept', answerRequest('accepted'));
router.put('/:id/decline', answerRequest('declined'));

module.exports = router;
