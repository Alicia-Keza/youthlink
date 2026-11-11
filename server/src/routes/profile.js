const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const SKILL_CATEGORIES = require('../skillCategories');
const { toList, toText } = require('../lists');
const { getProfile } = require('../profiles');

const router = express.Router();
router.use(requireAuth);

router.get('/me', (req, res) => {
  res.json({ profile: getProfile(req.user.id) });
});

router.put('/me', (req, res) => {
  const { bio = '', education = '', location = '', interests = [], lookingFor = [] } = req.body;

  if (String(bio).length > 500) {
    return res.status(400).json({ error: 'Bio must be 500 characters or less' });
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

  res.json({ profile: getProfile(req.user.id) });
});

router.get('/:userId', (req, res) => {
  const profile = getProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ profile });
});

module.exports = router;
