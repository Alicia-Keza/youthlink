const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const SKILL_CATEGORIES = require('../skillCategories');
const { toList, toText } = require('../lists');
const { getProfile } = require('../profiles');
const { checkLengths, checkList } = require('../validation');

const router = express.Router();
router.use(requireAuth);

router.get('/me', (req, res) => {
  res.json({ profile: getProfile(req.user.id) });
});

router.put('/me', (req, res) => {
  const { bio = '', education = '', location = '', interests = [], lookingFor = [] } = req.body;

  const error =
    checkLengths([
      [bio, 500, 'Bio'],
      [education, 200, 'Education'],
      [location, 100, 'Location'],
      [req.body.expertise, 200, 'Expertise'],
    ]) ||
    checkList(interests, 'Interests') ||
    checkList(req.body.focusAreas, 'Focus areas');
  if (error) {
    return res.status(400).json({ error });
  }

  // Only known skill areas can be saved as "looking for"
  const wanted = toList(lookingFor).filter((category) => SKILL_CATEGORIES.includes(category));

  db.prepare(
    `UPDATE profiles SET bio = ?, education = ?, location = ?, interests = ?, looking_for = ?
     WHERE user_id = ?`
  ).run(
    String(bio).trim(),
    String(education).trim(),
    String(location).trim(),
    toText(interests),
    toText(wanted),
    req.user.id
  );

  // Mentors and investors also describe their expertise and focus areas
  if (req.user.role === 'mentor' || req.user.role === 'investor') {
    const { expertise = '', focusAreas = [] } = req.body;
    db.prepare(
      `INSERT INTO mentor_profiles (user_id, expertise, focus_areas) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET expertise = excluded.expertise, focus_areas = excluded.focus_areas`
    ).run(req.user.id, String(expertise).trim(), toText(focusAreas));
  }

  res.json({ profile: getProfile(req.user.id) });
});

router.post('/me/skills', (req, res) => {
  const name = String(req.body.name || '').trim();
  const { category } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Skill name is required' });
  }
  if (name.length > 50) {
    return res.status(400).json({ error: 'Skill name must be 50 characters or less' });
  }
  if (!SKILL_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Please choose a valid skill category' });
  }

  const existing = db
    .prepare('SELECT id FROM skills WHERE user_id = ? AND lower(name) = lower(?)')
    .get(req.user.id, name);
  if (existing) {
    return res.status(409).json({ error: 'You have already added this skill' });
  }

  const result = db
    .prepare('INSERT INTO skills (user_id, name, category) VALUES (?, ?, ?)')
    .run(req.user.id, name, category);

  res.status(201).json({ skill: { id: result.lastInsertRowid, name, category } });
});

router.delete('/me/skills/:id', (req, res) => {
  const result = db
    .prepare('DELETE FROM skills WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  res.json({ message: 'Skill removed' });
});

router.get('/:userId', (req, res) => {
  const profile = getProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ profile });
});

module.exports = router;
