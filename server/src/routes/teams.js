const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { areConnected } = require('../connectionHelpers');
const { getSkills } = require('../profiles');
const { isMember } = require('../teamHelpers');
const notify = require('../notify');

const router = express.Router();
router.use(requireAuth);

function getTeam(teamId) {
  const team = db
    .prepare('SELECT id, name, description, created_by AS createdBy, created_at AS createdAt FROM teams WHERE id = ?')
    .get(teamId);
  if (!team) return null;

  const members = db
    .prepare(
      `SELECT u.id, u.name FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = ? ORDER BY tm.rowid`
    )
    .all(teamId);

  team.members = members.map((member) => ({ ...member, skills: getSkills(member.id) }));
  return team;
}

// Creates a team with the logged in user and the chosen connections
router.post('/', (req, res) => {
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const { memberIds } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Team name is required' });
  }
  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return res.status(400).json({ error: 'Choose at least one connection to form a team' });
  }

  // Remove repeated ids so nobody is added to the team twice
  const ids = [...new Set(memberIds.map(Number))];
  for (const id of ids) {
    if (!areConnected(req.user.id, id)) {
      return res.status(400).json({ error: 'You can only form a team with people you are connected with' });
    }
  }

  const createTeam = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)')
      .run(name, description, req.user.id);
    const teamId = result.lastInsertRowid;

    const addMember = db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)');
    addMember.run(teamId, req.user.id);
    ids.forEach((id) => addMember.run(teamId, id));
    return teamId;
  });

  const teamId = createTeam();
  ids.forEach((id) => {
    notify(id, 'team', `${req.user.name} added you to the team ${name}`, `/teams/${teamId}`);
  });

  res.status(201).json({ team: getTeam(teamId) });
});

// Lists the teams I am a member of
router.get('/', (req, res) => {
  const teams = db
    .prepare(
      `SELECT t.id, t.name, t.description,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS memberCount
       FROM teams t JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = ? ORDER BY t.id DESC`
    )
    .all(req.user.id);

  res.json({ teams });
});

router.get('/:id', (req, res) => {
  const team = getTeam(req.params.id);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  if (!isMember(team.id, req.user.id)) {
    return res.status(403).json({ error: 'Only team members can view this team' });
  }
  res.json({ team });
});

// A member can add one of their own connections to the team
router.post('/:id/members', (req, res) => {
  const team = getTeam(req.params.id);
  const userId = Number(req.body.userId);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  if (!isMember(team.id, req.user.id)) {
    return res.status(403).json({ error: 'Only team members can add people' });
  }
  if (!areConnected(req.user.id, userId)) {
    return res.status(400).json({ error: 'You can only add people you are connected with' });
  }
  if (isMember(team.id, userId)) {
    return res.status(409).json({ error: 'This person is already in the team' });
  }

  db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').run(team.id, userId);
  notify(userId, 'team', `${req.user.name} added you to the team ${team.name}`, `/teams/${team.id}`);

  res.status(201).json({ team: getTeam(team.id) });
});

router.delete('/:id/members/me', (req, res) => {
  const result = db
    .prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'You are not a member of this team' });
  }

  // Remove the team when the last member leaves
  const left = db.prepare('SELECT COUNT(*) AS count FROM team_members WHERE team_id = ?').get(req.params.id);
  if (left.count === 0) {
    db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  }

  res.json({ message: 'You left the team' });
});

module.exports = router;
