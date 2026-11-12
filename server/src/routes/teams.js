const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { areConnected } = require('../connectionHelpers');
const { getSkills } = require('../profiles');

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

  const ids = memberIds.map(Number);
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

  res.status(201).json({ team: getTeam(createTeam()) });
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

module.exports = router;
