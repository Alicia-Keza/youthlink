const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const PROJECT_STAGES = require('../projectStages');
const { isMember, memberIds } = require('../teamHelpers');
const notify = require('../notify');
const { checkLengths } = require('../validation');

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
  const lengthError = checkLengths([
    [title, 120, 'Project title'],
    [description, 2000, 'Description'],
  ]);
  if (lengthError) {
    return res.status(400).json({ error: lengthError });
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
  const investors = db
    .prepare(
      `SELECT u.id, u.name FROM project_interests pi
       JOIN users u ON u.id = pi.investor_id
       WHERE pi.project_id = ? ORDER BY pi.created_at`
    )
    .all(project.id);
  const canEdit = isMember(project.teamId, req.user.id);

  res.json({
    project: {
      ...project,
      // canEdit tells the page whether to show the edit buttons
      canEdit,
      interestCount: investors.length,
      interested: investors.some((investor) => investor.id === req.user.id),
      // Only the team sees which investors are interested
      investors: canEdit ? investors : undefined,
      feedback: getFeedback(project.id),
    },
  });
});

function getFeedback(projectId) {
  return db
    .prepare(
      `SELECT f.id, f.comment, f.created_at AS createdAt, u.name AS authorName, u.role AS authorRole
       FROM feedback f JOIN users u ON u.id = f.author_id
       WHERE f.project_id = ? ORDER BY f.id DESC`
    )
    .all(projectId);
}

// Mentors and investors leave feedback on a project
router.post('/:id/feedback', (req, res) => {
  const project = getProject(req.params.id);
  const comment = String(req.body.comment || '').trim();

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (req.user.role !== 'mentor' && req.user.role !== 'investor') {
    return res.status(403).json({ error: 'Only mentors and investors can give feedback' });
  }
  if (!comment) {
    return res.status(400).json({ error: 'Please write your feedback' });
  }
  if (comment.length > 1000) {
    return res.status(400).json({ error: 'Feedback must be 1000 characters or less' });
  }

  db.prepare('INSERT INTO feedback (project_id, author_id, comment) VALUES (?, ?, ?)').run(
    project.id,
    req.user.id,
    comment
  );

  memberIds(project.teamId).forEach((userId) => {
    notify(userId, 'feedback', `${req.user.name} gave feedback on ${project.title}`, `/projects/${project.id}`);
  });

  res.status(201).json({ feedback: getFeedback(project.id) });
});

// An investor marks a project as "interested in investing"
router.post('/:id/interest', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (req.user.role !== 'investor') {
    return res.status(403).json({ error: 'Only investors can show interest in investing' });
  }

  db.prepare('INSERT OR IGNORE INTO project_interests (project_id, investor_id) VALUES (?, ?)').run(
    project.id,
    req.user.id
  );
  res.status(201).json({ message: 'The team can now see that you are interested in investing' });
});

router.delete('/:id/interest', (req, res) => {
  db.prepare('DELETE FROM project_interests WHERE project_id = ? AND investor_id = ?').run(
    req.params.id,
    req.user.id
  );
  res.json({ message: 'Your interest has been removed' });
});

// Finds the project and checks that the logged in user is in its team.
// Sends the error response and returns null when the user cannot edit it.
function findEditableProject(req, res) {
  const project = getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return null;
  }
  if (!isMember(project.teamId, req.user.id)) {
    res.status(403).json({ error: 'Only team members can change this project' });
    return null;
  }
  return project;
}

router.put('/:id', (req, res) => {
  const project = findEditableProject(req, res);
  if (!project) return;

  const title = String(req.body.title || '').trim();
  const description = String(req.body.description || '').trim();
  if (!title) {
    return res.status(400).json({ error: 'Project title is required' });
  }
  const lengthError = checkLengths([
    [title, 120, 'Project title'],
    [description, 2000, 'Description'],
  ]);
  if (lengthError) {
    return res.status(400).json({ error: lengthError });
  }

  db.prepare("UPDATE projects SET title = ?, description = ?, updated_at = datetime('now') WHERE id = ?").run(
    title,
    description,
    project.id
  );
  res.json({ project: getProject(project.id) });
});

router.put('/:id/stage', (req, res) => {
  const project = findEditableProject(req, res);
  if (!project) return;

  const { stage } = req.body;
  if (!PROJECT_STAGES.includes(stage)) {
    return res.status(400).json({ error: 'Please choose a valid project stage' });
  }

  db.prepare("UPDATE projects SET stage = ?, updated_at = datetime('now') WHERE id = ?").run(stage, project.id);
  res.json({ project: getProject(project.id) });
});

module.exports = router;
