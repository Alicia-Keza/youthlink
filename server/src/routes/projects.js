const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const PROJECT_STAGES = require('../projectStages');
const { isMember } = require('../teamHelpers');

const router = express.Router();
router.use(requireAuth);

const PROJECT_FIELDS = `p.id, p.title, p.description, p.stage, p.team_id AS teamId, t.name AS teamName,
       p.created_at AS createdAt, p.updated_at AS updatedAt`;

function getProject(projectId) {
  return db
    .prepare(`SELECT ${PROJECT_FIELDS} FROM projects p JOIN teams t ON t.id = p.team_id WHERE p.id = ?`)
    .get(projectId);
}

// Lists all projects so that other users, mentors and investors can browse them.
// GET /api/projects?stage=...&teamId=...
router.get('/', (req, res) => {
  let projects = db
    .prepare(`SELECT ${PROJECT_FIELDS} FROM projects p JOIN teams t ON t.id = p.team_id ORDER BY p.id DESC`)
    .all();

  if (req.query.stage) {
    projects = projects.filter((project) => project.stage === req.query.stage);
  }
  if (req.query.teamId) {
    projects = projects.filter((project) => project.teamId === Number(req.query.teamId));
  }

  res.json({ projects });
});

// A team member creates a project for the team
router.post('/', (req, res) => {
  const teamId = Number(req.body.teamId);
  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  const stage = req.body.stage || PROJECT_STAGES[0];

  const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  if (!isMember(teamId, req.user.id)) {
    return res.status(403).json({ error: 'Only team members can create a project for this team' });
  }
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }
  if (!PROJECT_STAGES.includes(stage)) {
    return res.status(400).json({ error: 'Please choose a valid project stage' });
  }

  const result = db
    .prepare('INSERT INTO projects (team_id, title, description, stage) VALUES (?, ?, ?, ?)')
    .run(teamId, title, description, stage);

  res.status(201).json({ project: getProject(result.lastInsertRowid) });
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  // canEdit tells the page whether to show the edit buttons
  res.json({ project: { ...project, canEdit: isMember(project.teamId, req.user.id) } });
});

module.exports = router;
